import axios from "@web/services/axios/customer.axios";
import { Message, MessagesResponse } from "@web/types/chat";

export interface GetMessagesParams {
  roomId: string;
  page?: number;
  limit?: number;
  before?: string;
}

export const chatApi = {
  // Lấy lịch sử tin nhắn
  async getMessages(params: GetMessagesParams): Promise<MessagesResponse> {
    const res = await axios.get<MessagesResponse>("/api/messages", {
      params,
    });
    return res.data;
  },

  // Gửi tin nhắn mới
  async sendMessage(data: { roomId: string; text: string }) {
    const res = await axios.post<Message>("/api/messages", data);
    return res.data;
  },

  // Xóa tin nhắn
  async deleteMessage(id: string, userId: string) {
    const res = await axios.delete(`/api/messages/${id}`, {
      params: { userId },
    });
    return res.data;
  },
};
