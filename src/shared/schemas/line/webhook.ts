import { z } from 'zod';

// LINE Webhook Body Schema
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

// LINE Webhook Event Schema
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

// Type inference
export type LineWebhookEvent = z.infer<typeof lineWebhookEventSchema>;
export type LineWebhookBody = z.infer<typeof lineWebhookBodySchema>;