import { z } from 'zod';

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

// Type inference for base API response
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