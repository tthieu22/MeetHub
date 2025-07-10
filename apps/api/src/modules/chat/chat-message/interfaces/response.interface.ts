import { Message } from '@api/modules/chat/chat-message/schema/message.schema';

export interface MessagesResponse {
  data: Message[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
  // Cursor-based pagination fields
  hasMore?: boolean;
  before?: Date;
}

export interface SuccessResponse {
  success: boolean;
}

export interface FileResponse {
  url: string;
}
