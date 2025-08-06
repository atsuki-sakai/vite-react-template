import { z } from 'zod';
import { RetrievalModelSchema } from './dataset';

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

// Process Rule Schema for file document creation
export const ProcessRuleSchema = z.object({
  mode: z.enum(['automatic', 'custom']),
  rules: z.object({
    pre_processing_rules: z.array(z.object({
      id: z.enum(['remove_extra_spaces', 'remove_urls_emails']),
      enabled: z.boolean(),
    })).optional(),
    segmentation: z.object({
      separator: z.string().optional(),
      max_tokens: z.number().min(50).max(8000).optional(),
      parent_mode: z.enum(['full-doc', 'paragraph']).optional(),
      subchunk_segmentation: z.object({
        separator: z.string().optional(),
        max_tokens: z.number().min(50).max(8000).optional(),
      }).optional(),
      chunk_overlap: z.number().min(0).optional(),
    }).optional(),
  }).optional(),
});

// Create Document By Text Request Schema
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
        separator: z.enum(['\n', '\n\n', '***', '###', '===' , '.', '!?', ';', 'custom']).optional(),
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

// Update Document By Text Request Schema
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
        separator: z.enum(['\n', '\n\n', '***', '###', '===' , '.', '!?', ';', 'custom']).optional(),
        max_tokens: z.number().min(50).max(8000).optional(),
        chunk_overlap: z.number().min(0).optional(),
      }).optional(),
    }).optional(),
  }).optional(),
  doc_form: z.enum(['text_model', 'qa_model']).optional(),
  doc_language: z.string().optional(),
});

// Create Document By File Request Schema
export const CreateDocumentByFileRequestSchema = z.object({
  data: z.string(), // FormData as string for validation purposes
  original_document_id: z.string().optional(),
  indexing_technique: z.enum(['high_quality', 'economy']).optional(),
  doc_form: z.enum(['text_model', 'hierarchical_model', 'qa_model']).optional(),
  doc_language: z.string().optional(),
  process_rule: ProcessRuleSchema.optional(),
  retrieval_model: RetrievalModelSchema.optional(),
  embedding_model: z.string().optional(),
  embedding_model_provider: z.string().optional(),
});

// Document Embedding Status Schema
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

// Enhanced CreateDocumentByFileRequest interface with detailed retrieval model support
export interface CreateDocumentByFileRequest {
  data: FormData; // Contains the file
  original_document_id?: string;
  indexing_technique?: 'high_quality' | 'economy';
  doc_form?: 'text_model' | 'hierarchical_model' | 'qa_model';
  doc_language?: string;
  process_rule?: {
    mode: 'automatic' | 'custom';
    rules?: {
      pre_processing_rules?: Array<{
        id: 'remove_extra_spaces' | 'remove_urls_emails';
        enabled: boolean;
      }>;
      segmentation?: {
        separator?: string;
        max_tokens?: number;
        parent_mode?: 'full-doc' | 'paragraph';
        subchunk_segmentation?: {
          separator?: string;
          max_tokens?: number;
        };
        chunk_overlap?: number;
      };
    };
  };
  retrieval_model?: {
    search_method: 'hybrid_search' | 'semantic_search' | 'full_text_search';
    reranking_enable: boolean;
    reranking_mode?: {
      reranking_provider_name: string;
      reranking_model_name: string;
    };
    top_k: number;
    score_threshold_enabled: boolean;
    score_threshold?: number;
  };
  embedding_model?: string;
  embedding_model_provider?: string;
}

// Type inference
export type DifyDocument = z.infer<typeof DifyDocumentSchema>;
export type ProcessRule = z.infer<typeof ProcessRuleSchema>;
export type CreateDocumentByTextRequest = z.infer<typeof CreateDocumentByTextRequestSchema>;
export type UpdateDocumentByTextRequest = z.infer<typeof UpdateDocumentByTextRequestSchema>;
export type CreateDocumentByFileRequestData = z.infer<typeof CreateDocumentByFileRequestSchema>;
export type DocumentEmbeddingStatus = z.infer<typeof DocumentEmbeddingStatusSchema>;