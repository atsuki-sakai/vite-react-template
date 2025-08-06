import { z } from 'zod';

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

// Detailed Retrieval Model Schema for file document creation
export const RetrievalModelSchema = z.object({
  search_method: z.enum(['hybrid_search', 'semantic_search', 'full_text_search']),
  reranking_enable: z.boolean(),
  reranking_mode: z.object({
    reranking_provider_name: z.string(),
    reranking_model_name: z.string(),
  }).optional(),
  top_k: z.number().min(1).max(100),
  score_threshold_enabled: z.boolean(),
  score_threshold: z.number().min(0).max(1).optional(),
});

// Create Dataset Request Schema
export const CreateDatasetRequestSchema = z.object({
  name: z.string().min(1, 'Dataset name is required'),
  description: z.string().nullable().optional(),
  permission: z.enum(['only_me', 'all_team_members', 'partial_members']),
  indexing_technique: z.enum(['high_quality', 'economy']).optional(),
  embedding_model: z.string().optional(),
  embedding_model_provider: z.string().optional(),
  retrieval_model: RetrievalModelSchema.optional(),
});

// Type inference
export type DifyDataset = z.infer<typeof DifyDatasetSchema>;
export type RetrievalModel = z.infer<typeof RetrievalModelSchema>;
export type CreateDatasetRequest = z.infer<typeof CreateDatasetRequestSchema>;