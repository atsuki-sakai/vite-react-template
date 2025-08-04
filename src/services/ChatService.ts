import { ChatHistoryListRequest, ChatHistoryListResponse, ChatMessage } from '../shared/schemas';

export class ChatService {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  async getChatHistory(params?: ChatHistoryListRequest): Promise<ChatHistoryListResponse> {
    const searchParams = new URLSearchParams();
    
    if (params?.limit) {
      searchParams.append('limit', params.limit.toString());
    }
    if (params?.offset) {
      searchParams.append('offset', params.offset.toString());
    }
    if (params?.conversation_id) {
      searchParams.append('conversation_id', params.conversation_id);
    }
    if (params?.user_id) {
      searchParams.append('user_id', params.user_id);
    }

    const url = `${this.baseUrl}/chat/messages${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch chat history: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getChatMessage(id: number): Promise<{ success: boolean; data: ChatMessage }> {
    const response = await fetch(`${this.baseUrl}/chat/messages/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch chat message: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}

export const chatService = new ChatService();