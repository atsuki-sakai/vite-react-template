// LINE validation functions
import { 
  lineWebhookBodySchema, 
  lineWebhookEventSchema 
} from '../line/webhook';

import type {
  LineWebhookBody,
  LineWebhookEvent
} from '../line/webhook';

// Validation functions
export const validateLineWebhookBody = (data: unknown): LineWebhookBody => {
  return lineWebhookBodySchema.parse(data);
};

export const validateLineWebhookEvent = (data: unknown): LineWebhookEvent => {
  return lineWebhookEventSchema.parse(data);
};

// Safe parsing functions
export const safeParseLineWebhookBody = (data: unknown) => {
  return lineWebhookBodySchema.safeParse(data);
};

export const safeParseLineWebhookEvent = (data: unknown) => {
  return lineWebhookEventSchema.safeParse(data);
};