import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { chatService } from '../../services/ChatService';
import { ChatHistoryListRequest, ChatHistoryListResponse, ChatMessage } from '../schemas';

export const useChatHistory = (
  params?: ChatHistoryListRequest,
  options?: Omit<UseQueryOptions<ChatHistoryListResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['chatHistory', params],
    queryFn: () => chatService.getChatHistory(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    ...options
  });
};

export const useChatMessage = (
  id: number,
  options?: Omit<UseQueryOptions<{ success: boolean; data: ChatMessage }, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['chatMessage', id],
    queryFn: () => chatService.getChatMessage(id),
    enabled: !!id && id > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    ...options
  });
};