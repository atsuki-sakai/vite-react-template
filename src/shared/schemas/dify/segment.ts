import { z } from 'zod';

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

// Create Segment Request Schema
export const CreateSegmentRequestSchema = z.object({
  segments: z.array(z.object({
    content: z.string().min(1, 'Segment content is required'),
    answer: z.string().nullable().optional(),
    keywords: z.array(z.string()).optional(),
  })).min(1, 'At least one segment is required'),
});

// Document Segments Response Schema
export const DocumentSegmentsResponseSchema = z.object({
  data: z.array(DifySegmentSchema),
  doc_form: z.enum(['text_model', 'qa_model']),
  has_more: z.boolean(),
  limit: z.number(),
  total: z.number(),
  page: z.number(),
});

// Type inference
export type DifySegment = z.infer<typeof DifySegmentSchema>;
export type CreateSegmentRequest = z.infer<typeof CreateSegmentRequestSchema>;
export type DocumentSegmentsResponse = z.infer<typeof DocumentSegmentsResponseSchema>;