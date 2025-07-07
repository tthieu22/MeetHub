import { apiClient } from "../client";
import {
  Message,
  CreateMessageRequest,
  PaginatedResponse,
  User,
  MessageFile,
} from "../types";

export class MessageService {
  // 1. Gửi tin nhắn mới
  static async sendMessage(
    data: CreateMessageRequest,
    conversationId: string
  ): Promise<Message> {
    const requestData = { ...data, conversationId };
    const response = await apiClient.post<Message>("/messages", requestData);
    return response.data;
  }

  // 2. Lấy danh sách tin nhắn trong phòng
  static async getMessages(
    conversationId: string,
    page = 1,
    limit = 50
  ): Promise<PaginatedResponse<Message>> {
    const response = await apiClient.get<PaginatedResponse<Message>>(
      "/messages",
      {
        params: {
          conversationId,
          page,
          limit,
        },
      }
    );
    return response.data;
  }

  // 3. Thu hồi / xóa mềm tin nhắn
  static async deleteMessage(messageId: string): Promise<void> {
    await apiClient.delete(`/messages/${messageId}`);
  }

  // 4. Ghim hoặc bỏ ghim tin nhắn
  static async togglePinMessage(messageId: string): Promise<Message> {
    const response = await apiClient.put<Message>(`/messages/${messageId}/pin`);
    return response.data;
  }

  // 5. Lấy danh sách user bị mention trong tin nhắn
  static async getMessageMentions(messageId: string): Promise<User[]> {
    const response = await apiClient.get<User[]>(
      `/messages/${messageId}/mentions`
    );
    return response.data;
  }

  // 8. Upload file cho tin nhắn
  static async uploadFile(messageId: string, file: File): Promise<void> {
    const formData = new FormData();
    formData.append("file", file);
    await apiClient.upload(`/messages/${messageId}/upload`, formData);
  }

  // 9. Lấy danh sách file đính kèm
  static async getMessageFiles(messageId: string): Promise<MessageFile[]> {
    const response = await apiClient.get<MessageFile[]>(
      `/messages/${messageId}/files`
    );
    return response.data;
  }

  // 21. Đánh dấu tin nhắn là đã đọc
  static async markAsRead(messageId: string): Promise<void> {
    await apiClient.put(`/messages/${messageId}/read`);
  }
}
