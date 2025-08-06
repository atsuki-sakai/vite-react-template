// Dify validation functions
import { 
  DifyDatasetSchema, 
  CreateDatasetRequestSchema, 
  RetrievalModelSchema 
} from '../dify/dataset';
import { 
  DifyDocumentSchema, 
  ProcessRuleSchema,
  CreateDocumentByTextRequestSchema,
  UpdateDocumentByTextRequestSchema,
  CreateDocumentByFileRequestSchema,
  DocumentEmbeddingStatusSchema
} from '../dify/document';
import { 
  DifySegmentSchema, 
  CreateSegmentRequestSchema,
  DocumentSegmentsResponseSchema
} from '../dify/segment';
import { 
  DifyChatRequestSchema, 
  DifyChatResponseSchema 
} from '../dify/chat';

import type {
  DifyDataset,
  CreateDatasetRequest,
  RetrievalModel
} from '../dify/dataset';
import type {
  DifyDocument,
  ProcessRule,
  CreateDocumentByTextRequest,
  UpdateDocumentByTextRequest,
  CreateDocumentByFileRequestData,
  DocumentEmbeddingStatus
} from '../dify/document';
import type {
  DifySegment,
  CreateSegmentRequest,
  DocumentSegmentsResponse
} from '../dify/segment';
import type {
  DifyChatRequest,
  DifyChatResponse
} from '../dify/chat';

// Dataset validations
export const validateDifyDataset = (data: unknown): DifyDataset => {
  return DifyDatasetSchema.parse(data);
};

export const validateCreateDatasetRequest = (data: unknown): CreateDatasetRequest => {
  return CreateDatasetRequestSchema.parse(data);
};

export const validateRetrievalModel = (data: unknown): RetrievalModel => {
  return RetrievalModelSchema.parse(data);
};

// Document validations
export const validateDifyDocument = (data: unknown): DifyDocument => {
  return DifyDocumentSchema.parse(data);
};

export const validateProcessRule = (data: unknown): ProcessRule => {
  return ProcessRuleSchema.parse(data);
};

export const validateCreateDocumentByTextRequest = (data: unknown): CreateDocumentByTextRequest => {
  return CreateDocumentByTextRequestSchema.parse(data);
};

export const validateUpdateDocumentByTextRequest = (data: unknown): UpdateDocumentByTextRequest => {
  return UpdateDocumentByTextRequestSchema.parse(data);
};

export const validateCreateDocumentByFileRequest = (data: unknown): CreateDocumentByFileRequestData => {
  return CreateDocumentByFileRequestSchema.parse(data);
};

export const validateDocumentEmbeddingStatus = (data: unknown): DocumentEmbeddingStatus => {
  return DocumentEmbeddingStatusSchema.parse(data);
};

// Segment validations
export const validateDifySegment = (data: unknown): DifySegment => {
  return DifySegmentSchema.parse(data);
};

export const validateCreateSegmentRequest = (data: unknown): CreateSegmentRequest => {
  return CreateSegmentRequestSchema.parse(data);
};

export const validateDocumentSegmentsResponse = (data: unknown): DocumentSegmentsResponse => {
  return DocumentSegmentsResponseSchema.parse(data);
};

// Chat validations
export const validateDifyChatRequest = (data: unknown): DifyChatRequest => {
  return DifyChatRequestSchema.parse(data);
};

export const validateDifyChatResponse = (data: unknown): DifyChatResponse => {
  return DifyChatResponseSchema.parse(data);
};

// Safe parsing functions (returns result with success/error)
export const safeParseDifyDataset = (data: unknown) => {
  return DifyDatasetSchema.safeParse(data);
};

export const safeParseCreateDatasetRequest = (data: unknown) => {
  return CreateDatasetRequestSchema.safeParse(data);
};

export const safeParseRetrievalModel = (data: unknown) => {
  return RetrievalModelSchema.safeParse(data);
};

export const safeParseDifyDocument = (data: unknown) => {
  return DifyDocumentSchema.safeParse(data);
};

export const safeParseProcessRule = (data: unknown) => {
  return ProcessRuleSchema.safeParse(data);
};

export const safeParseCreateDocumentByTextRequest = (data: unknown) => {
  return CreateDocumentByTextRequestSchema.safeParse(data);
};

export const safeParseUpdateDocumentByTextRequest = (data: unknown) => {
  return UpdateDocumentByTextRequestSchema.safeParse(data);
};

export const safeParseCreateDocumentByFileRequest = (data: unknown) => {
  return CreateDocumentByFileRequestSchema.safeParse(data);
};

export const safeParseDocumentEmbeddingStatus = (data: unknown) => {
  return DocumentEmbeddingStatusSchema.safeParse(data);
};

export const safeParseDifySegment = (data: unknown) => {
  return DifySegmentSchema.safeParse(data);
};

export const safeParseCreateSegmentRequest = (data: unknown) => {
  return CreateSegmentRequestSchema.safeParse(data);
};

export const safeParseDocumentSegmentsResponse = (data: unknown) => {
  return DocumentSegmentsResponseSchema.safeParse(data);
};

export const safeParseDifyChatRequest = (data: unknown) => {
  return DifyChatRequestSchema.safeParse(data);
};

export const safeParseDifyChatResponse = (data: unknown) => {
  return DifyChatResponseSchema.safeParse(data);
};