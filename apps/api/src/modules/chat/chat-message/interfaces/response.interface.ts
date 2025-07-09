import { Message } from '@api/modules/chat/chat-message/schema/message.schema';

export interface MessagesResponse {
  data: Message[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface SuccessResponse {
  success: boolean;
}

export interface FileResponse {
  url: string;
}
