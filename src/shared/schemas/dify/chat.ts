import { z } from 'zod';

// Chat Request Schema
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

// Chat Response Schema
export const DifyChatResponseSchema = z.object({
  answer: z.string(),
  conversation_id: z.string().optional(),
});

// Type inference
export type DifyChatRequest = z.infer<typeof DifyChatRequestSchema>;
export type DifyChatResponse = z.infer<typeof DifyChatResponseSchema>;