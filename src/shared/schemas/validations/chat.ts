// Chat validation functions
import { 
  ChatMessageSchema, 
  ChatHistoryListRequestSchema, 
  ChatHistoryListResponseSchema 
} from '../chat/history';

import type {
  ChatMessage,
  ChatHistoryListRequest,
  ChatHistoryListResponse
} from '../chat/history';

// Validation functions
export const validateChatMessage = (data: unknown): ChatMessage => {
  return ChatMessageSchema.parse(data);
};

export const validateChatHistoryListRequest = (data: unknown): ChatHistoryListRequest => {
  return ChatHistoryListRequestSchema.parse(data);
};

export const validateChatHistoryListResponse = (data: unknown): ChatHistoryListResponse => {
  return ChatHistoryListResponseSchema.parse(data);
};

// Safe parsing functions
export const safeParseChatMessage = (data: unknown) => {
  return ChatMessageSchema.safeParse(data);
};

export const safeParseChatHistoryListRequest = (data: unknown) => {
  return ChatHistoryListRequestSchema.safeParse(data);
};

export const safeParseChatHistoryListResponse = (data: unknown) => {
  return ChatHistoryListResponseSchema.safeParse(data);
};