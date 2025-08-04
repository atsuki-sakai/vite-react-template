import { z } from 'zod';

/**
 * Shared Zod schemas for Dify API
 * These schemas provide runtime type validation and can be used in both frontend and backend
 */

// Base API Response Schema
export const DifyApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema.optional(),
    has_more: z.boolean().optional(),
    total: z.number().optional(),
    page: z.number().optional(),
    limit: z.number().optional(),
    error: z.string().optional(),
    code: z.string().optional(),
    message: z.string().optional(),
    status: z.string().optional(),
  });

// Dataset Schema
export const DifyDatasetSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  permission: z.enum(['only_me', 'all_team_members', 'partial_members']),
  document_count: z.number(),
  word_count: z.number(),
  created_by: z.string().optional(),
  created_at: z.number(),
  updated_at: z.number().optional(),
  embedding_model: z.string().nullable(),
  embedding_model_provider: z.string().nullable().optional(),
  embedding_available: z.boolean().optional(),
  retrieval_model_dict: z.object({
    search_method: z.enum(['semantic_search', 'full_text_search', 'hybrid_search']),
    reranking_enable: z.boolean(),
    reranking_model: z.object({
      reranking_provider_name: z.string(),
      reranking_model_name: z.string(),
    }).optional(),
    top_k: z.number(),
    score_threshold_enabled: z.boolean(),
    score_threshold: z.number().nullable().optional(),
  }).optional(),
  tags: z.array(z.string()).optional(),
});

// Document Schema
export const DifyDocumentSchema = z.object({
  id: z.string(),
  name: z.string(),
  character_count: z.number().optional(),
  tokens: z.number(),
  word_count: z.number().nullable().optional(),
  position: z.number().optional(),
  data_source_type: z.enum(['upload_file', 'notion_import', 'web_crawl', 'text_model']),
  data_source_info: z.object({
    upload_file_id: z.string().optional(),
    upload_file_name: z.string().optional(),
    upload_file_size: z.number().optional(),
    upload_file_extension: z.string().optional(),
    upload_file_mime_type: z.string().optional(),
    notion_workspace_id: z.string().optional(),
    notion_obj_id: z.string().optional(),
    notion_page_type: z.string().optional(),
    web_crawl_url: z.string().optional(),
  }).optional(),
  data_source_detail_dict: z.object({
    upload_file: z.object({
      id: z.string(),
      name: z.string(),
      size: z.number(),
      extension: z.string(),
      mime_type: z.string(),
      created_by: z.string(),
      created_at: z.number(),
    }).optional(),
  }).optional(),
  dataset_process_rule_id: z.string().optional(),
  processing_status: z.enum(['processing', 'completed', 'error', 'paused']).optional(),
  error: z.string().nullable().optional(),
  enabled: z.boolean(),
  disabled_at: z.number().nullable().optional(),
  disabled_by: z.string().nullable().optional(),
  archived: z.boolean().optional(),
  display_status: z.enum(['available', 'processing', 'error', 'archived', 'queuing']),
  created_from: z.enum(['api', 'web']),
  created_by: z.string().optional(),
  created_at: z.number(),
  updated_at: z.number().optional(),
  indexing_status: z.enum(['completed', 'processing', 'waiting', 'error', 'paused']),
  hit_count: z.number().optional(),
  doc_form: z.enum(['text_model', 'qa_model', 'hierarchical_model']),
  doc_language: z.string().optional(),
  doc_metadata: z.any().nullable().optional(),
  batch: z.string().optional(),
  segment_count: z.number().optional(),
  average_segment_length: z.number().optional(),
  dataset_id: z.string().optional(),
  file_id: z.string().optional(),
});

export const DifyChatRequestSchema = z.object({
  inputs: z.record(z.string(), z.any()).optional(),
  query: z.string(),
  response_mode: z.literal("blocking"),
  user: z.string(),
  conversation_id: z.string().optional(),
  files: z.array(z.object({
    type: z.string(),
    transfer_method: z.string(),
    url: z.string(),
  })).optional(),
});

export const DifyChatResponseSchema = z.object({
  answer: z.string(),
  conversation_id: z.string().optional(),
});

// Segment Schema
export const DifySegmentSchema = z.object({
  id: z.string(),
  position: z.number(),
  document_id: z.string(),
  content: z.string(),
  answer: z.string().nullable().optional(),
  word_count: z.number().nullable().optional(),
  tokens: z.number(),
  keywords: z.array(z.string()).nullable().optional(),
  index_node_id: z.string().optional(),
  index_node_hash: z.string().optional(),
  hit_count: z.number().optional(),
  enabled: z.boolean(),
  disabled_at: z.number().nullable().optional(),
  disabled_by: z.string().nullable().optional(),
  status: z.enum(['completed', 'processing', 'error', 'waiting']),
  error: z.string().nullable().optional(),
  stopped_at: z.number().nullable().optional(),
  created_by: z.string().optional(),
  created_at: z.number(),
  updated_at: z.number().optional(),
  indexing_at: z.number().nullable().optional(),
  completed_at: z.number().nullable().optional(),
  paused_by: z.string().nullable().optional(),
  paused_at: z.number().nullable().optional(),
  recovered_by: z.string().nullable().optional(),
  recovered_at: z.number().nullable().optional(),
});

// Request Schemas
export const CreateDatasetRequestSchema = z.object({
  name: z.string().min(1, 'Dataset name is required'),
  description: z.string().nullable().optional(),
  permission: z.enum(['only_me', 'all_team_members', 'partial_members']),
  indexing_technique: z.enum(['high_quality', 'economy']).optional(),
  embedding_model: z.string().optional(),
  embedding_model_provider: z.string().optional(),
  retrieval_model: z.object({
    search_method: z.enum(['semantic_search', 'full_text_search', 'hybrid_search']),
    reranking_enable: z.boolean(),
    reranking_model: z.object({
      reranking_provider_name: z.string(),
      reranking_model_name: z.string(),
    }).optional(),
    top_k: z.number().min(1).max(100),
    score_threshold_enabled: z.boolean(),
    score_threshold: z.number().min(0).max(1).optional(),
  }).optional(),
});

export const CreateDocumentByTextRequestSchema = z.object({
  name: z.string().min(1, 'Document name is required'),
  text: z.string().min(1, 'Document text is required'),
  indexing_technique: z.enum(['high_quality', 'economy']).default('high_quality'),
  process_rule: z.object({
    mode: z.enum(['automatic', 'custom']).default('automatic'),
    rules: z.object({
      pre_processing_rules: z.array(z.object({
        id: z.string(),
        enabled: z.boolean(),
      })).optional(),
      segmentation: z.object({
        separator: z.enum(['\n', '\n\n', '.', '!?', ';', 'custom']).optional(),
        max_tokens: z.number().min(50).max(8000).optional(),
        chunk_overlap: z.number().min(0).optional(),
      }).optional(),
    }).optional(),
  }).default({ mode: 'automatic' }),
  duplicate_check: z.boolean().optional(),
  original_document_id: z.string().optional(),
  doc_form: z.enum(['text_model', 'qa_model']).optional(),
  doc_language: z.string().optional(),
});

export const UpdateDocumentByTextRequestSchema = z.object({
  name: z.string().optional(),
  text: z.string().min(1, 'Document text is required'),
  process_rule: z.object({
    mode: z.enum(['automatic', 'custom']),
    rules: z.object({
      pre_processing_rules: z.array(z.object({
        id: z.string(),
        enabled: z.boolean(),
      })).optional(),
      segmentation: z.object({
        separator: z.enum(['\n', '\n\n', '.', '!?', ';', 'custom']).optional(),
        max_tokens: z.number().min(50).max(8000).optional(),
        chunk_overlap: z.number().min(0).optional(),
      }).optional(),
    }).optional(),
  }).optional(),
  doc_form: z.enum(['text_model', 'qa_model']).optional(),
  doc_language: z.string().optional(),
});

export const CreateSegmentRequestSchema = z.object({
  segments: z.array(z.object({
    content: z.string().min(1, 'Segment content is required'),
    answer: z.string().nullable().optional(),
    keywords: z.array(z.string()).optional(),
  })).min(1, 'At least one segment is required'),
});

export const DocumentEmbeddingStatusSchema = z.object({
  id: z.string(),
  indexing_status: z.enum(['completed', 'processing', 'waiting', 'error', 'paused']),
  processing_status: z.enum(['processing', 'completed', 'error', 'paused']),
  error: z.string().nullable().optional(),
  processing_started_at: z.number().nullable().optional(),
  parsing_completed_at: z.number().nullable().optional(),
  cleaning_completed_at: z.number().nullable().optional(),
  splitting_completed_at: z.number().nullable().optional(),
  completed_at: z.number().nullable().optional(),
  paused_at: z.number().nullable().optional(),
  stopped_at: z.number().nullable().optional(),
  tokens: z.number().optional(),
  completed_segments: z.number().optional(),
  total_segments: z.number().optional(),
});

export const DocumentSegmentsResponseSchema = z.object({
  data: z.array(DifySegmentSchema),
  doc_form: z.enum(['text_model', 'qa_model']),
  has_more: z.boolean(),
  limit: z.number(),
  total: z.number(),
  page: z.number(),
});

// Type inference from schemas
export type DifyChatRequest = z.infer<typeof DifyChatRequestSchema>;
export type DifyChatResponse = z.infer<typeof DifyChatResponseSchema>;
export type DifyDataset = z.infer<typeof DifyDatasetSchema>;
export type DifyDocument = z.infer<typeof DifyDocumentSchema>;
export type DifySegment = z.infer<typeof DifySegmentSchema>;
export type DocumentSegmentsResponse = z.infer<typeof DocumentSegmentsResponseSchema>;
export type CreateDatasetRequest = z.infer<typeof CreateDatasetRequestSchema>;
export type CreateDocumentByTextRequest = z.infer<typeof CreateDocumentByTextRequestSchema>;
export type UpdateDocumentByTextRequest = z.infer<typeof UpdateDocumentByTextRequestSchema>;
export type CreateSegmentRequest = z.infer<typeof CreateSegmentRequestSchema>;

// Note: CreateDocumentByFileRequest uses FormData which cannot be easily represented in Zod
// We'll define this as a TypeScript interface since FormData is a browser/runtime-specific type
export interface CreateDocumentByFileRequest {
  data: FormData; // Contains the file
  indexing_technique?: 'high_quality' | 'economy';
  process_rule?: {
    mode: 'automatic' | 'custom';
    rules?: {
      pre_processing_rules?: Array<{
        id: string;
        enabled: boolean;
      }>;
      segmentation?: {
        separator?: '\n' | '\n\n' | '.' | '!?' | ';' | 'custom';
        max_tokens?: number;
        chunk_overlap?: number;
      };
    };
  };
  duplicate_check?: boolean;
  original_document_id?: string;
  doc_form?: 'text_model' | 'qa_model';
  doc_language?: string;
}
export type DocumentEmbeddingStatus = z.infer<typeof DocumentEmbeddingStatusSchema>;
export type DifyApiResponse<T> = {
  data?: T;
  has_more?: boolean;
  total?: number;
  page?: number;
  limit?: number;
  error?: string;
  code?: string;
  message?: string;
  status?: string;
};

// Validation helper functions
export const validateCreateDatasetRequest = (data: unknown): CreateDatasetRequest => {
  return CreateDatasetRequestSchema.parse(data);
};

export const validateCreateDocumentByTextRequest = (data: unknown): CreateDocumentByTextRequest => {
  return CreateDocumentByTextRequestSchema.parse(data);
};

export const validateUpdateDocumentByTextRequest = (data: unknown): UpdateDocumentByTextRequest => {
  return UpdateDocumentByTextRequestSchema.parse(data);
};

export const validateCreateSegmentRequest = (data: unknown): CreateSegmentRequest => {
  return CreateSegmentRequestSchema.parse(data);
};

export const validateDifyDataset = (data: unknown): DifyDataset => {
  return DifyDatasetSchema.parse(data);
};

export const validateDifyDocument = (data: unknown): DifyDocument => {
  return DifyDocumentSchema.parse(data);
};

export const validateDifySegment = (data: unknown): DifySegment => {
  return DifySegmentSchema.parse(data);
};

export const validateDocumentEmbeddingStatus = (data: unknown): DocumentEmbeddingStatus => {
  return DocumentEmbeddingStatusSchema.parse(data);
};

// Safe parsing functions (returns result with success/error)
export const safeParseCreateDatasetRequest = (data: unknown) => {
  return CreateDatasetRequestSchema.safeParse(data);
};

export const safeParseCreateDocumentByTextRequest = (data: unknown) => {
  return CreateDocumentByTextRequestSchema.safeParse(data);
};

export const safeParseUpdateDocumentByTextRequest = (data: unknown) => {
  return UpdateDocumentByTextRequestSchema.safeParse(data);
};

export const safeParseCreateSegmentRequest = (data: unknown) => {
  return CreateSegmentRequestSchema.safeParse(data);
};

export const safeParseDifyDataset = (data: unknown) => {
  return DifyDatasetSchema.safeParse(data);
};

export const safeParseDifyDocument = (data: unknown) => {
  return DifyDocumentSchema.safeParse(data);
};

export const safeParseDifySegment = (data: unknown) => {
  return DifySegmentSchema.safeParse(data);
};

export const safeParseDocumentEmbeddingStatus = (data: unknown) => {
  return DocumentEmbeddingStatusSchema.safeParse(data);
};


// LINE
export const lineWebhookBodySchema = z.object({
  destination: z.string(),
  events: z.array(z.object({
      type: z.string(),
      message: z.object({
          type: z.string(),
          text: z.string().optional(),
      }),
  })),
});

export const lineWebhookEventSchema = z.object({
  type: z.string(),
  mode: z.string().optional(),
  timestamp: z.number(),
  source: z.object({
    type: z.string(),
    userId: z.string(),
  }),
  webhookEventId: z.string(),
  deliveryContext: z.object({
    isRedelivery: z.boolean(),
  }),
  message: z.object({
    id: z.string(),
    type: z.enum(["text", "image"]),
    quoteToken: z.string().optional(),
    text: z.string().optional(),
    contentProvider: z.object({
    type: z.string(),
    originalContentUrl: z.string().optional(),
    previewImageUrl: z.string().optional(),
    }).optional(),
  }).optional(),
  replyToken: z.string(),
});

export type LineWebhookEvent = z.infer<typeof lineWebhookEventSchema>;
export type LineWebhookBody = z.infer<typeof lineWebhookBodySchema>;

// Chat History Schemas
export const ChatMessageSchema = z.object({
  id: z.number(),
  conversation_id: z.string(),
  user_id: z.string(),
  message_type: z.string(),
  message_content: z.string().nullable(),
  image_url: z.string().nullable(),
  dify_response: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const ChatHistoryListRequestSchema = z.object({
  limit: z.number().min(1).max(100).optional().default(50),
  offset: z.number().min(0).optional().default(0),
  conversation_id: z.string().optional(),
  user_id: z.string().optional(),
});

export const ChatHistoryListResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    messages: z.array(ChatMessageSchema),
    total: z.number(),
    limit: z.number(),
    offset: z.number(),
  }),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ChatHistoryListRequest = z.infer<typeof ChatHistoryListRequestSchema>;
export type ChatHistoryListResponse = z.infer<typeof ChatHistoryListResponseSchema>;

