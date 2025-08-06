import { z } from 'zod';

// Chat Message Schema
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

// Chat History List Request Schema
export const ChatHistoryListRequestSchema = z.object({
  limit: z.number().min(1).max(100).optional().default(50),
  offset: z.number().min(0).optional().default(0),
  conversation_id: z.string().optional(),
  user_id: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

// Chat History List Response Schema
export const ChatHistoryListResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    messages: z.array(ChatMessageSchema),
    total: z.number(),
    limit: z.number(),
    offset: z.number(),
  }),
});

// Type inference
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ChatHistoryListRequest = z.infer<typeof ChatHistoryListRequestSchema>;
export type ChatHistoryListResponse = z.infer<typeof ChatHistoryListResponseSchema>;