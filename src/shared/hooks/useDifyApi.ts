import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DifyDataset,
  DifyDocument,
  DifySegment,
  CreateDatasetRequest,
  CreateDocumentByTextRequest,
  UpdateDocumentByTextRequest,
  CreateSegmentRequest,
  DifyApiResponse,
  DocumentEmbeddingStatus,
  validateCreateDatasetRequest,
  validateCreateDocumentByTextRequest,
  validateUpdateDocumentByTextRequest,
  validateCreateSegmentRequest,
  safeParseDifyDataset,
  safeParseDifyDocument,
  safeParseDifySegment,
  safeParseDocumentEmbeddingStatus
} from '../schemas';

const apiCall = async <T>(
  endpoint: string,
  options: RequestInit = {},
  validator?: (data: unknown) => { success: boolean; data?: T; error?: unknown }
): Promise<DifyApiResponse<T>> => {
  const response = await fetch(`/api${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  const result = await response.json() as DifyApiResponse<T>;

  if (result.error) {
    throw new Error(result.error || 'Unknown error');
  }

  if (validator && result.data) {
    const validationResult = validator(result.data);
    if (!validationResult.success) {
      throw new Error('Invalid response format');
    }
    result.data = validationResult.data;
  }

  return result;
};

export function useDifyApi() {
  const queryClient = useQueryClient();

  const useKnowledgeList = (page = 1, limit = 100) => {
    return useQuery({
      queryKey: ['knowledgeList', page, limit],
      queryFn: () => apiCall<DifyDataset[]>(
        `/get-knowledge-list?page=${page}&limit=${limit}`,
        { method: 'GET' },
        (data) => {
          if (Array.isArray(data)) {
            const validatedData: DifyDataset[] = [];
            for (const item of data) {
              const result = safeParseDifyDataset(item);
              if (result.success) {
                validatedData.push(result.data);
              } else {
                throw new Error("Validation error for item: " + item + " " + JSON.stringify(result.error));
              }
            }
            return { success: true, data: validatedData };
          }
          return { success: false, error: 'Expected array of datasets' };
        }
      ).then(result => result.data || [])
    });
  };

  const useDataset = (datasetId: string, enabled = true) => {
    return useQuery({
      queryKey: ['dataset', datasetId],
      queryFn: () => apiCall<DifyDataset>(
        `/datasets/${datasetId}`,
        { method: 'GET' },
        (data) => safeParseDifyDataset(data)
      ).then(result => result.data),
      enabled
    });
  };

  const useDocuments = (datasetId: string, page = 1, limit = 20, enabled = true) => {
    return useQuery({
      queryKey: ['documents', datasetId, page, limit],
      queryFn: () => apiCall<DifyDocument[]>(
        `/datasets/${datasetId}/documents?page=${page}&limit=${limit}`,
        { method: 'GET' },
        (data) => {
          if (Array.isArray(data)) {
            const validatedData: DifyDocument[] = [];
            for (const item of data) {
              const result = safeParseDifyDocument(item);
              if (result.success) {
                validatedData.push(result.data);
              } else {
                throw new Error("Validation error for item: " + item + " " + JSON.stringify(result.error));
              }
            }
            return { success: true, data: validatedData };
          }
          return { success: false, error: 'Expected array of documents' };
        }
      ).then(result => result.data || []),
      enabled
    });
  };

  const useDocumentDetails = (datasetId: string, documentId: string, metadata = 'all', enabled = true) => {
    return useQuery({
      queryKey: ['documentDetails', datasetId, documentId, metadata],
      queryFn: () => apiCall<DifyDocument>(
        `/datasets/${datasetId}/documents/${documentId}?metadata=${metadata}`,
        { method: 'GET' },
        (data) => safeParseDifyDocument(data)
      ).then(result => result.data),
      enabled
    });
  };

  const useDocumentEmbeddingStatus = (datasetId: string, documentId: string, enabled = true) => {
    return useQuery({
      queryKey: ['documentEmbeddingStatus', datasetId, documentId],
      queryFn: () => apiCall<DocumentEmbeddingStatus>(
        `/datasets/${datasetId}/documents/${documentId}/status`,
        { method: 'GET' },
        (data) => safeParseDocumentEmbeddingStatus(data)
      ).then(result => result.data),
      enabled
    });
  };

  const useDocumentSegments = (datasetId: string, documentId: string, page = 1, limit = 20, enabled = true) => {
    return useQuery({
      queryKey: ['documentSegments', datasetId, documentId, page, limit],
      queryFn: () => apiCall<DifySegment[]>(
        `/datasets/${datasetId}/documents/${documentId}/segments?page=${page}&limit=${limit}`,
        { method: 'GET' },
        (data) => {
          if (Array.isArray(data)) {
            const validatedData: DifySegment[] = [];
            for (const item of data) {
              const result = safeParseDifySegment(item);
              if (result.success) {
                validatedData.push(result.data);
              } else {
                throw new Error("Validation error for item: " + item + " " + JSON.stringify(result.error));
              }
            }
            return { success: true, data: validatedData };
          }
          return { success: false, error: 'Expected array of segments' };
        }
      ).then(result => result.data || []),
      enabled
    });
  };

  const createDatasetMutation = useMutation({
    mutationFn: async (request: CreateDatasetRequest) => {
      const validatedRequest = validateCreateDatasetRequest(request);
      return apiCall<DifyDataset>(
        '/datasets',
        {
          method: 'POST',
          body: JSON.stringify(validatedRequest)
        },
        (data) => safeParseDifyDataset(data)
      ).then(result => result.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledgeList'] });
    }
  });

  const deleteDatasetMutation = useMutation({
    mutationFn: async (datasetId: string) => {
      return apiCall<{ message: string }>(
        `/datasets/${datasetId}`,
        { method: 'DELETE' }
      ).then(result => result.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledgeList'] });
    }
  });

  const createDocumentByTextMutation = useMutation({
    mutationFn: async ({ datasetId, request }: { datasetId: string; request: CreateDocumentByTextRequest }) => {
      const validatedRequest = validateCreateDocumentByTextRequest(request);
      return apiCall<DifyDocument>(
        `/datasets/${datasetId}/documents/text`,
        {
          method: 'POST',
          body: JSON.stringify(validatedRequest)
        },
        (data) => safeParseDifyDocument(data)
      ).then(result => result.data);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents', variables.datasetId] });
    }
  });

  const updateDocumentByTextMutation = useMutation({
    mutationFn: async ({ 
      datasetId, 
      documentId, 
      request 
    }: { 
      datasetId: string; 
      documentId: string; 
      request: UpdateDocumentByTextRequest 
    }) => {
      const validatedRequest = validateUpdateDocumentByTextRequest(request);
      return apiCall<DifyDocument>(
        `/datasets/${datasetId}/documents/${documentId}/text`,
        {
          method: 'PUT',
          body: JSON.stringify(validatedRequest)
        },
        (data) => safeParseDifyDocument(data)
      ).then(result => result.data);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents', variables.datasetId] });
      queryClient.invalidateQueries({ queryKey: ['documentDetails', variables.datasetId, variables.documentId] });
    }
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async ({ datasetId, documentId }: { datasetId: string; documentId: string }) => {
      return apiCall<{ message: string }>(
        `/datasets/${datasetId}/documents/${documentId}`,
        { method: 'DELETE' }
      ).then(result => result.data);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents', variables.datasetId] });
    }
  });

  const createDocumentSegmentsMutation = useMutation({
    mutationFn: async ({ 
      datasetId, 
      documentId, 
      request 
    }: { 
      datasetId: string; 
      documentId: string; 
      request: CreateSegmentRequest 
    }) => {
      const validatedRequest = validateCreateSegmentRequest(request);
      return apiCall<DifySegment[]>(
        `/datasets/${datasetId}/documents/${documentId}/segments`,
        {
          method: 'POST',
          body: JSON.stringify(validatedRequest)
        },
        (data) => {
          if (Array.isArray(data)) {
            const validatedData: DifySegment[] = [];
            for (const item of data) {
              const result = safeParseDifySegment(item);
              if (result.success) {
                validatedData.push(result.data);
              }
            }
            return { success: true, data: validatedData };
          }
          return { success: false, error: 'Expected array of segments' };
        }
      ).then(result => result.data || []);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documentSegments', variables.datasetId, variables.documentId] });
    }
  });

  const deleteDocumentSegmentMutation = useMutation({
    mutationFn: async ({ 
      datasetId, 
      documentId, 
      segmentId 
    }: { 
      datasetId: string; 
      documentId: string; 
      segmentId: string 
    }) => {
      return apiCall<{ message: string }>(
        `/datasets/${datasetId}/documents/${documentId}/segments/${segmentId}`,
        { method: 'DELETE' }
      ).then(result => result.data);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documentSegments', variables.datasetId, variables.documentId] });
    }
  });

  return {
    // Query hooks
    useKnowledgeList,
    useDataset,
    useDocuments,
    useDocumentDetails,
    useDocumentEmbeddingStatus,
    useDocumentSegments,

    // Mutation hooks
    createDataset: createDatasetMutation,
    deleteDataset: deleteDatasetMutation,
    createDocumentByText: createDocumentByTextMutation,
    updateDocumentByText: updateDocumentByTextMutation,
    deleteDocument: deleteDocumentMutation,
    createDocumentSegments: createDocumentSegmentsMutation,
    deleteDocumentSegment: deleteDocumentSegmentMutation
  };
}