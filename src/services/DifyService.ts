import { 
  DifyApiResponse, 
  DifyDataset, 
  DifyDocument,
  DifySegment,
  CreateDatasetRequest,
  CreateDocumentByTextRequest,
  UpdateDocumentByTextRequest,
  CreateSegmentRequest,
  DocumentEmbeddingStatus,
  validateCreateDatasetRequest,
  validateCreateDocumentByTextRequest,
  safeParseDifyDataset,
  safeParseDifyDocument,
  // DifyChatRequest,
  DifyChatResponse,
  FEATURE_FLAGS,
  PREMIUM_FEATURE_MESSAGES,
  API_ERROR_CODES,
} from "../shared";
import { 
  generateDifyInputs, 
  debugLogInputs,
  type ConversationVariableContext 
} from "../config/dify-variables";
import type { AIResponse } from "../worker/types";
import type { D1Database } from "@cloudflare/workers-types";
import type { Workflow } from "@cloudflare/workers-types";

interface Env {
  LINE_CHANNEL_SECRET: string;
  LINE_CHANNEL_ACCESS_TOKEN: string;
  DIFY_CHAT_API_KEY: string;
  DIFY_KNOWLEDGE_KEY: string;
  DIFY_API_ENDPOINT: string;
  ADMIN_USER: string;
  ADMIN_PASSWORD: string;
  DB: D1Database;
  LINE_MESSAGE_WORKFLOW: Workflow;
}

/**
 * Helper function to create DifyService instance with error handling
 */
export function createDifyService(env: Env, type: "chat" | "knowledge" = "knowledge"): DifyService {
  let apiKey: string;
  if (type === "chat") {
    apiKey = env.DIFY_CHAT_API_KEY;
  } else if (type === "knowledge") {
    apiKey = env.DIFY_KNOWLEDGE_KEY;
  } else {
    throw new Error("Invalid Dify service type");
  }
  return new DifyService(apiKey, env.DIFY_API_ENDPOINT);
}

/**
 * DifyService - A robust service class for interacting with Dify API
 * 
 * Features:
 * - Comprehensive error handling with detailed logging
 * - Type-safe method signatures
 * - Configurable base URL for different environments
 * - Consistent response format handling
 * - Built for scalability and maintainability
 */
export class DifyService {
  private readonly apiUrl: string;
  private readonly apiKey: string;
  
  constructor(apiKey: string, apiUrl: string = "https://api.dify.ai/v1") {
    if (!apiKey) {
      throw new Error("API key is required for DifyService");
    }
    if (!apiUrl) {
      throw new Error("API URL is required for DifyService");
    }
    
    this.apiKey = apiKey;
    this.apiUrl = apiUrl.replace(/\/$/, ''); // Remove trailing slash
    
    console.log(`[DifyService] Initialized with URL: ${this.apiUrl}`);
  }

  /**
   * Create standardized headers for API requests
   */
  private getHeaders(contentType: string = 'application/json'): Record<string, string> {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`
    };
    
    if (contentType) {
      headers['Content-Type'] = contentType;
    }
    
    return headers;
  }

  /**
   * Generic HTTP request wrapper with comprehensive error handling and Zod validation
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    context: string = 'API request',
    validator?: (data: unknown) => { success: boolean; data?: T; error?: unknown }
  ): Promise<DifyApiResponse<T>> {
    const url = `${this.apiUrl}${endpoint}`;
    
    try {
      console.log(`[DifyService] ${context} - Making ${options.method || 'GET'} request to: ${url}`);
      
      if (options.body && typeof options.body === 'string') {
        console.log(`[DifyService] ${context} - Request body:`, options.body);
      }

      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers
        }
      });

      console.log(`[DifyService] ${context} - Response status: ${response.status} ${response.statusText}`);
      console.log(`[DifyService] ${context} - Response headers:`, Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[DifyService] ${context} - API error:`, {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        
        return {
          error: `${context} failed: ${response.status} ${response.statusText}`,
          code: response.status.toString(),
          message: errorText || 'Unknown error occurred'
        };
      }

      const responseText = await response.text();
      let rawData: unknown;
      
      try {
        rawData = JSON.parse(responseText);
        console.log(`[DifyService] ${context} - Raw response:`, JSON.stringify(rawData, null, 2));
      } catch (parseError) {
        console.error(`[DifyService] ${context} - Failed to parse JSON response:`, parseError);
        console.error(`[DifyService] ${context} - Raw response:`, responseText);
        return {
          error: `${context} failed: Invalid JSON response`,
          message: 'Failed to parse response data'
        };
      }

      // Handle different response formats from Dify API
      let responseData: DifyApiResponse<T>;
      if (rawData && typeof rawData === 'object' && 'data' in rawData) {
        responseData = rawData as DifyApiResponse<T>;
      } else {
        responseData = { data: rawData as T };
      }

      // Validate response data if validator is provided
      if (validator && responseData.data !== undefined && responseData.data !== null) {
        const validationResult = validator(responseData.data);
        if (!validationResult.success) {
          console.error(`[DifyService] ${context} - Response validation failed:`, validationResult.error);
          return {
            error: `${context} failed: Invalid response format`,
            message: 'Response data does not match expected schema'
          };
        }
        responseData.data = validationResult.data;
        console.log(`[DifyService] ${context} - Response validation successful`);
      }

      return responseData;

    } catch (error) {
      console.error(`[DifyService] ${context} - Network/Runtime error:`, error);
      return {
        error: `${context} failed: Network or runtime error`,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Chat with Dify API
   */
  async processMessage(
    message: string,
    conversationId: string,
    userId: string,
    imageUrl?: string | null
  ): Promise<AIResponse> {
    const startTime = Date.now();
    
    // メッセージ長さ制限（10,000文字）
    if (message.length > 10000) {
      console.warn("Message too long, truncating:", message.length);
      message = message.substring(0, 10000) + "...";
    }
    
    try {
      // Generate dynamic inputs using the conversation variables system
      const context: ConversationVariableContext = {
        conversationId,
        userId,
        customerName: "",
        phone: "",
        reservationDateAndTime: "",
        menuName: "",
        llmContext: [],
        userContext: [],
        timestamp: new Date().toISOString()
      };

      const inputs = generateDifyInputs(context);
      debugLogInputs(inputs, context);

      const requestBody = {
        debug: true,
        inputs,
        query: message,
        response_mode: "blocking",
        user: userId,
        conversation_id: conversationId,
      };

      console.log("[DifyService] Sending to Dify API:", JSON.stringify(requestBody, null, 2));

      // タイムアウト制御付きでfetch実行
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000000); // 100分タイムアウト

      const response = await fetch(`${this.apiUrl}/chat-messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      console.log("response: ", response);
      
      clearTimeout(timeoutId);

      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Dify API error:", errorText);
        // Handle specific error cases
        if (response.status === 404 && errorText.includes("Conversation Not Exists")) {
          console.log("Conversation not found, retrying with new conversation");
          return this.processMessage(message, "", userId, imageUrl);
        } else if (response.status === 401) {
          return { answer: "申し訳ございません。認証エラーが発生しました。" };
        } else if (response.status === 403) {
          return { answer: "申し訳ございません。アクセス権限がありません。" };
        } else if (response.status === 429) {
          return { answer: "申し訳ございません。リクエスト制限に達しました。しばらく時間をおいて再度お試しください。" };
        } else if (response.status >= 500) {
          return { answer: "申し訳ございません。サーバーエラーが発生しました。" };
        }
        return { answer: "申し訳ございません。一時的にサービスが利用できません。" };
      }

      let difyResult: DifyChatResponse;
      try {
        difyResult = await response.json() as DifyChatResponse;
      } catch (parseError) {
        console.error("Failed to parse Dify API response as JSON:", parseError);
        return { answer: "申し訳ございません。応答の解析に失敗しました。" };
      }
      
      // Validate that we have a meaningful answer
      if (!difyResult.answer || difyResult.answer.trim() === "") {
        return { answer: "申し訳ございません。回答を生成できませんでした。" };
      }
      
      return {
        answer: difyResult.answer,
        conversation_id: difyResult.conversation_id
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      // タイムアウトエラーの場合
      if (error instanceof Error && error.name === 'AbortError') {
        console.error(`Dify API timeout after ${duration}ms`);
        return { answer: "申し訳ございません。応答に時間がかかりすぎています。もう一度お試しください。" };
      }
      console.error(`[DifyService] processMessage - Unexpected error after ${duration}ms:`, error);
      return { answer: "申し訳ございません。一時的にサービスが利用できません。" };
    }
  }

  /**
   * Get list of knowledge bases (datasets) with pagination support
   */
  async getKnowledgeList(page: number = 1, limit: number = 20): Promise<DifyApiResponse<DifyDataset[]>> {
    if (page < 1 || limit < 1 || limit > 100) {
      console.error('[DifyService] getKnowledgeList - Invalid pagination parameters:', { page, limit });
      return {
        error: 'Invalid pagination parameters',
        message: 'Page must be >= 1 and limit must be between 1 and 100'
      };
    }

    return this.makeRequest<DifyDataset[]>(
      `/datasets?page=${page}&limit=${limit}`,
      { method: 'GET' },
      'Get knowledge list',
      (data) => {
        if (Array.isArray(data)) {
          const validatedData: DifyDataset[] = [];
          for (const item of data) {
            const result = safeParseDifyDataset(item);
            if (result.success) {
              validatedData.push(result.data);
            } else {
              console.warn('[DifyService] Invalid dataset in response, accepting anyway:', result.error);
              // Accept the raw data even if validation fails
              validatedData.push(item as DifyDataset);
            }
          }
          return { success: true, data: validatedData };
        }
        return { success: false, error: 'Expected array of datasets' };
      }
    );
  }

  /**
   * Create a new dataset (knowledge base)
   */
  async createDataset(request: CreateDatasetRequest): Promise<DifyApiResponse<DifyDataset>> {
    try {
      const validatedRequest = validateCreateDatasetRequest(request);
      console.log('[DifyService] createDataset - Request validation successful');
      
      return this.makeRequest<DifyDataset>(
        '/datasets',
        {
          method: 'POST',
          body: JSON.stringify(validatedRequest)
        },
        'Create dataset',
        (data) => {
          console.log('[DifyService] createDataset - Validating response data:', JSON.stringify(data, null, 2));
          const result = safeParseDifyDataset(data);
          if (!result.success) {
            console.warn('[DifyService] createDataset - Response validation failed but accepting anyway:', result.error);
            // Return the raw data if validation fails - this allows the API to work even if schema doesn't match exactly
            return { success: true, data: data as DifyDataset };
          }
          return result;
        }
      );
    } catch (validationError) {
      console.error('[DifyService] createDataset - Request validation failed:', validationError);
      return {
        error: 'Validation failed',
        message: validationError instanceof Error ? validationError.message : 'Invalid request data'
      };
    }
  }

  /**
   * Get single dataset details by ID
   */
  async getDataset(datasetId: string): Promise<DifyApiResponse<DifyDataset>> {
    if (!datasetId?.trim()) {
      console.error('[DifyService] getDataset - Dataset ID is required');
      return {
        error: 'Validation failed',
        message: 'Dataset ID is required'
      };
    }

    return this.makeRequest<DifyDataset>(
      `/datasets/${datasetId}`,
      { method: 'GET' },
      `Get dataset ${datasetId}`,
      (data) => safeParseDifyDataset(data)
    );
  }

  /**
   * Delete a dataset by ID
   */
  async deleteDataset(datasetId: string): Promise<DifyApiResponse<{ message: string }>> {
    if (!datasetId?.trim()) {
      console.error('[DifyService] deleteDataset - Dataset ID is required');
      return {
        error: 'Validation failed',
        message: 'Dataset ID is required'
      };
    }

    const result = await this.makeRequest<{ message: string }>(
      `/datasets/${datasetId}`,
      { method: 'DELETE' },
      `Delete dataset ${datasetId}`
    );

    if (!result.error) {
      result.data = { message: 'Dataset deleted successfully' };
    }

    return result;
  }

  /**
   * Get documents in a dataset with pagination
   */
  async getDocuments(datasetId: string, page: number = 1, limit: number = 20): Promise<DifyApiResponse<DifyDocument[]>> {
    if (!datasetId?.trim()) {
      console.error('[DifyService] getDocuments - Dataset ID is required');
      return {
        error: 'Validation failed',
        message: 'Dataset ID is required'
      };
    }

    if (page < 1 || limit < 1 || limit > 100) {
      console.error('[DifyService] getDocuments - Invalid pagination parameters:', { page, limit });
      return {
        error: 'Invalid pagination parameters',
        message: 'Page must be >= 1 and limit must be between 1 and 100'
      };
    }

    return this.makeRequest<DifyDocument[]>(
      `/datasets/${datasetId}/documents?page=${page}&limit=${limit}`,
      { method: 'GET' },
      `Get documents for dataset ${datasetId}`
    );
  }

  /**
   * Create a document from text content
   */
  async createDocumentByText(datasetId: string, request: CreateDocumentByTextRequest): Promise<DifyApiResponse<DifyDocument>> {
    if (!datasetId?.trim()) {
      console.error('[DifyService] createDocumentByText - Dataset ID is required');
      return {
        error: 'Validation failed',
        message: 'Dataset ID is required'
      };
    }

    try {
      const validatedRequest = validateCreateDocumentByTextRequest(request);
      console.log('[DifyService] createDocumentByText - Request validation successful');
      
      return this.makeRequest<DifyDocument>(
        `/datasets/${datasetId}/document/create_by_text`,
        {
          method: 'POST',
          body: JSON.stringify(validatedRequest)
        },
        `Create document by text in dataset ${datasetId}`,
        (data) => {
          // Dify API returns document data nested under 'document' key
          if (data && typeof data === 'object' && 'document' in data) {
            const result = safeParseDifyDocument((data as any).document); // eslint-disable-line @typescript-eslint/no-explicit-any
            if (!result.success) {
              console.warn('[DifyService] createDocumentByText - Document validation failed but accepting anyway:', result.error);
              // Return the raw document data if validation fails
              return { success: true, data: (data as any).document as DifyDocument }; // eslint-disable-line @typescript-eslint/no-explicit-any
            }
            return result;
          }
          // Fallback to original validation if structure is different
          return safeParseDifyDocument(data);
        }
      );
    } catch (validationError) {
      console.error('[DifyService] createDocumentByText - Request validation failed:', validationError);
      return {
        error: 'Validation failed',
        message: validationError instanceof Error ? validationError.message : 'Invalid request data'
      };
    }
  }

  /**
   * Create a document from file upload
   */
  async createDocumentByFile(datasetId: string, formData: FormData): Promise<DifyApiResponse<DifyDocument>> {
    if (!datasetId?.trim()) {
      console.error('[DifyService] createDocumentByFile - Dataset ID is required');
      return {
        error: 'Validation failed',
        message: 'Dataset ID is required'
      };
    }

    if (!formData.has('file')) {
      console.error('[DifyService] createDocumentByFile - File is required');
      return {
        error: 'Validation failed',
        message: 'File is required in FormData under "file" key'
      };
    }

    // Ensure the FormData has the correct structure for Dify API
    if (!formData.has('data')) {
      // Add default data configuration if not provided
      const defaultConfig = {
        original_document_id: '1234567890',
        indexing_technique: 'high_quality',
        doc_form: {
          
        },
        process_rule: {
          mode: 'automatic'
        }
      };
      formData.set('data', JSON.stringify(defaultConfig));
    }

    const url = `${this.apiUrl}/datasets/${datasetId}/document/create-by-file`;
    
    try {
      console.log(`[DifyService] Create document by file - Making POST request to: ${url}`);
      console.log(`[DifyService] Create document by file - FormData keys:`, Array.from(formData.keys()));

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
          // Note: Don't set Content-Type for FormData, let browser set it with boundary
        },
        body: formData
      });

      console.log(`[DifyService] Create document by file - Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[DifyService] Create document by file - API error:`, {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        
        return {
          error: `Create document by file failed: ${response.status} ${response.statusText}`,
          code: response.status.toString(),
          message: errorText || 'Unknown error occurred'
        };
      }

      const responseText = await response.text();
      let data: DifyApiResponse<DifyDocument>;
      
      try {
        const rawData = JSON.parse(responseText);
        console.log(`[DifyService] Create document by file - Raw response:`, JSON.stringify(rawData, null, 2));
        
        // Handle nested document structure like in createDocumentByText
        if (rawData && typeof rawData === 'object' && 'document' in rawData) {
          data = { data: rawData.document };
        } else {
          data = rawData;
        }
      } catch (parseError) {
        console.error(`[DifyService] Create document by file - Failed to parse response:`, parseError);
        return {
          error: 'Create document by file failed: Invalid response format',
          message: 'Failed to parse response data'
        };
      }
      
      return data;

    } catch (error) {
      console.error(`[DifyService] Create document by file - Network/Runtime error:`, error);
      return {
        error: 'Create document by file failed: Network or runtime error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Update a document with new text content
   */
  async updateDocumentByText(datasetId: string, documentId: string, request: UpdateDocumentByTextRequest): Promise<DifyApiResponse<DifyDocument>> {
    if (!datasetId?.trim() || !documentId?.trim()) {
      console.error('[DifyService] updateDocumentByText - Dataset ID and Document ID are required');
      return {
        error: 'Validation failed',
        message: 'Dataset ID and Document ID are required'
      };
    }

    if (!request.text?.trim()) {
      console.error('[DifyService] updateDocumentByText - Text content is required');
      return {
        error: 'Validation failed',
        message: 'Text content is required'
      };
    }

    return this.makeRequest<DifyDocument>(
      `/datasets/${datasetId}/documents/${documentId}/update_by_text`,
      {
        method: 'POST',
        body: JSON.stringify(request)
      },
      `Update document ${documentId} by text in dataset ${datasetId}`
    );
  }

  /**
   * Update a document with new file content
   */
  async updateDocumentByFile(datasetId: string, documentId: string, formData: FormData): Promise<DifyApiResponse<DifyDocument>> {
    if (!datasetId?.trim() || !documentId?.trim()) {
      console.error('[DifyService] updateDocumentByFile - Dataset ID and Document ID are required');
      return {
        error: 'Validation failed',
        message: 'Dataset ID and Document ID are required'
      };
    }

    const url = `${this.apiUrl}/datasets/${datasetId}/documents/${documentId}/update-by-file`;
    
    try {
      console.log(`[DifyService] Update document by file - Making POST request to: ${url}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: formData
      });

      console.log(`[DifyService] Update document by file - Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[DifyService] Update document by file - API error:`, {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        
        return {
          error: `Update document by file failed: ${response.status} ${response.statusText}`,
          code: response.status.toString(),
          message: errorText || 'Unknown error occurred'
        };
      }

      const data = await response.json() as DifyApiResponse<DifyDocument>;
      console.log(`[DifyService] Update document by file - Success:`, JSON.stringify(data, null, 2));
      
      return data;

    } catch (error) {
      console.error(`[DifyService] Update document by file - Network/Runtime error:`, error);
      return {
        error: 'Update document by file failed: Network or runtime error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get single document details with metadata options
   */
  async getSingleDocumentDetails(datasetId: string, documentId: string, metadata: string = 'all'): Promise<DifyApiResponse<DifyDocument>> {
    if (!datasetId?.trim() || !documentId?.trim()) {
      console.error('[DifyService] getSingleDocumentDetails - Dataset ID and Document ID are required');
      return {
        error: 'Validation failed',
        message: 'Dataset ID and Document ID are required'
      };
    }

    return this.makeRequest<DifyDocument>(
      `/datasets/${datasetId}/documents/${documentId}?metadata=${metadata}`,
      { method: 'GET' },
      `Get document ${documentId} details in dataset ${datasetId}`
    );
  }

  /**
   * Get document embedding status
   */
  async getDocumentEmbeddingStatus(datasetId: string, documentId: string): Promise<DifyApiResponse<DocumentEmbeddingStatus>> {
    if (!datasetId?.trim() || !documentId?.trim()) {
      console.error('[DifyService] getDocumentEmbeddingStatus - Dataset ID and Document ID are required');
      return {
        error: 'Validation failed',
        message: 'Dataset ID and Document ID are required'
      };
    }

    return this.makeRequest<DocumentEmbeddingStatus>(
      `/datasets/${datasetId}/documents/${documentId}/status`,
      { method: 'GET' },
      `Get document ${documentId} embedding status in dataset ${datasetId}`
    );
  }

  /**
   * Delete a document from dataset
   */
  async deleteDocument(datasetId: string, documentId: string): Promise<DifyApiResponse<{ message: string }>> {
    if (!datasetId?.trim() || !documentId?.trim()) {
      console.error('[DifyService] deleteDocument - Dataset ID and Document ID are required');
      return {
        error: 'Validation failed',
        message: 'Dataset ID and Document ID are required'
      };
    }

    const result = await this.makeRequest<{ message: string }>(
      `/datasets/${datasetId}/documents/${documentId}`,
      { method: 'DELETE' },
      `Delete document ${documentId} from dataset ${datasetId}`
    );

    if (!result.error) {
      result.data = { message: 'Document deleted successfully' };
    }

    return result;
  }

  /**
   * Get document segments (chunks) with pagination support
   */
  async getDocumentSegments(datasetId: string, documentId: string, page: number = 1, limit: number = 20): Promise<DifyApiResponse<DifySegment[]>> {
    if (!datasetId?.trim() || !documentId?.trim()) {
      console.error('[DifyService] getDocumentSegments - Dataset ID and Document ID are required');
      return {
        error: 'Validation failed',
        message: 'Dataset ID and Document ID are required'
      };
    }

    if (page < 1 || limit < 1 || limit > 100) {
      console.error('[DifyService] getDocumentSegments - Invalid pagination parameters:', { page, limit });
      return {
        error: 'Invalid pagination parameters',
        message: 'Page must be >= 1 and limit must be between 1 and 100'
      };
    }

    return this.makeRequest<DifySegment[]>(
      `/datasets/${datasetId}/documents/${documentId}/segments?page=${page}&limit=${limit}`,
      { method: 'GET' },
      `Get segments for document ${documentId} in dataset ${datasetId} (page ${page}, limit ${limit})`
    );
  }

  /**
   * Create document segments
   */
  async createDocumentSegments(datasetId: string, documentId: string, request: CreateSegmentRequest): Promise<DifyApiResponse<DifySegment[]>> {
    // Check if premium features are enabled
    if (!FEATURE_FLAGS.ENABLE_DIFY_PREMIUM_FEATURES) {
      console.warn('[DifyService] createDocumentSegments - Premium features are disabled');
      return {
        error: API_ERROR_CODES.PREMIUM_FEATURE_REQUIRED,
        code: API_ERROR_CODES.FORBIDDEN.toString(),
        message: PREMIUM_FEATURE_MESSAGES.SEGMENT_CREATE_DISABLED
      };
    }

    if (!datasetId?.trim() || !documentId?.trim()) {
      console.error('[DifyService] createDocumentSegments - Dataset ID and Document ID are required');
      return {
        error: 'Validation failed',
        message: 'Dataset ID and Document ID are required'
      };
    }

    console.log('[DifyService] createDocumentSegments - Request data:', JSON.stringify(request, null, 2));

    if (!request.segments || !Array.isArray(request.segments) || request.segments.length === 0) {
      console.error('[DifyService] createDocumentSegments - Segments array is required', request);
      return {
        error: 'Validation failed',
        message: 'Segments array is required and cannot be empty'
      };
    }

    // Validate each segment has required content
    for (let i = 0; i < request.segments.length; i++) {
      const segment = request.segments[i];
      if (!segment.content?.trim()) {
        console.error(`[DifyService] createDocumentSegments - Segment ${i} must have content:`, segment);
        return {
          error: 'Validation failed',
          message: `Segment ${i + 1} must have non-empty content`
        };
      }
    }

    console.log(`[DifyService] createDocumentSegments - Creating ${request.segments.length} segments for document ${documentId}`);

    return this.makeRequest<DifySegment[]>(
      `/datasets/${datasetId}/documents/${documentId}/segments`,
      {
        method: 'POST',
        body: JSON.stringify(request)
      },
      `Create segments for document ${documentId} in dataset ${datasetId}`,
      (data) => {
        console.log('[DifyService] createDocumentSegments - Response data:', JSON.stringify(data, null, 2));
        // Validate that we got an array of segments back
        if (Array.isArray(data)) {
          return { success: true, data: data as DifySegment[] };
        }
        console.warn('[DifyService] createDocumentSegments - Expected array but got:', typeof data, data);
        return { success: false, error: 'Expected array of segments in response' };
      }
    );
  }

  /**
   * Update a document segment
   */
  async updateDocumentSegment(datasetId: string, documentId: string, segmentId: string): Promise<DifyApiResponse<DifySegment>> {
    if (!datasetId?.trim() || !documentId?.trim() || !segmentId?.trim()) {
      console.error('[DifyService] updateDocumentSegment - Dataset ID, Document ID, and Segment ID are required');
      return {
        error: 'Validation failed',
        message: 'Dataset ID, Document ID, and Segment ID are required'
      };
    }

    return this.makeRequest<DifySegment>(
      `/datasets/${datasetId}/documents/${documentId}/segments/${segmentId}`,
      { method: 'POST' },
      `Update segment ${segmentId} in document ${documentId} in dataset ${datasetId}`
    );
  }

  /**
   * Delete a document segment
   */
  async deleteDocumentSegment(datasetId: string, documentId: string, segmentId: string): Promise<DifyApiResponse<{ message: string }>> {
    // Check if premium features are enabled
    if (!FEATURE_FLAGS.ENABLE_DIFY_PREMIUM_FEATURES) {
      console.warn('[DifyService] deleteDocumentSegment - Premium features are disabled');
      return {
        error: API_ERROR_CODES.PREMIUM_FEATURE_REQUIRED,
        code: API_ERROR_CODES.FORBIDDEN.toString(),
        message: PREMIUM_FEATURE_MESSAGES.SEGMENT_DELETE_DISABLED
      };
    }

    if (!datasetId?.trim() || !documentId?.trim() || !segmentId?.trim()) {
      console.error('[DifyService] deleteDocumentSegment - Dataset ID, Document ID, and Segment ID are required');
      return {
        error: 'Validation failed',
        message: 'Dataset ID, Document ID, and Segment ID are required'
      };
    }

    console.log(`[DifyService] deleteDocumentSegment - Deleting segment ${segmentId} from document ${documentId} in dataset ${datasetId}`);

    const result = await this.makeRequest<{ message: string }>(
      `/datasets/${datasetId}/documents/${documentId}/segments/${segmentId}`,
      { method: 'DELETE' },
      `Delete segment ${segmentId} from document ${documentId} in dataset ${datasetId}`
    );

    if (!result.error) {
      result.data = { message: 'Segment deleted successfully' };
      console.log(`[DifyService] deleteDocumentSegment - Successfully deleted segment ${segmentId}`);
    } else {
      console.error('[DifyService] deleteDocumentSegment - Failed to delete segment:', result);
    }

    return result;
  }
}
