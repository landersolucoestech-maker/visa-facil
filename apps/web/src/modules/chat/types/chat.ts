export type ChatConversationStatus = 'open' | 'waiting' | 'closed';

export interface ChatMessage {
  id: string;
  conversationId: string;
  direction: 'incoming' | 'outgoing';
  body: string;
  sentAt: string;
}

export interface ChatConversation {
  id: string;
  clientId: string;
  processId?: string;
  status: ChatConversationStatus;
  unread: boolean;
  unreadCount: number;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
}
