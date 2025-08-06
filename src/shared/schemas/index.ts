// Main schemas index - clean exports for all schemas, types, and validations

// Schema exports by domain
export * from './dify';
export * from './line';
export * from './chat';

// Validation functions
export * from './validations';

// Re-export commonly used schemas for backward compatibility
export { DifyApiResponseSchema, type DifyApiResponse } from './dify/base';
export { 
  DifyDatasetSchema, 
  RetrievalModelSchema, 
  CreateDatasetRequestSchema,
  type DifyDataset,
  type RetrievalModel,
  type CreateDatasetRequest
} from './dify/dataset';
export { 
  DifyDocumentSchema,
  ProcessRuleSchema,
  CreateDocumentByTextRequestSchema,
  UpdateDocumentByTextRequestSchema,
  CreateDocumentByFileRequestSchema,
  DocumentEmbeddingStatusSchema,
  type DifyDocument,
  type ProcessRule,
  type CreateDocumentByTextRequest,
  type UpdateDocumentByTextRequest,
  type CreateDocumentByFileRequest,
  type CreateDocumentByFileRequestData,
  type DocumentEmbeddingStatus
} from './dify/document';
export { 
  DifySegmentSchema,
  CreateSegmentRequestSchema,
  DocumentSegmentsResponseSchema,
  type DifySegment,
  type CreateSegmentRequest,
  type DocumentSegmentsResponse
} from './dify/segment';
export { 
  DifyChatRequestSchema,
  DifyChatResponseSchema,
  type DifyChatRequest,
  type DifyChatResponse
} from './dify/chat';
export { 
  lineWebhookBodySchema,
  lineWebhookEventSchema,
  type LineWebhookBody,
  type LineWebhookEvent
} from './line/webhook';
export { 
  ChatMessageSchema,
  ChatHistoryListRequestSchema,
  ChatHistoryListResponseSchema,
  type ChatMessage,
  type ChatHistoryListRequest,
  type ChatHistoryListResponse
} from './chat/history';