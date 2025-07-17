import axios from "../axios/customer.axios";
import { MessagesResponse } from "@web/types/chat";

export interface GetMessagesParams {
  roomId: string;
  page?: number;
  limit?: number;
  before?: string;
}

class ChatApiService {
  async getMessages(params: GetMessagesParams): Promise<MessagesResponse> {
    const res = await axios.get<MessagesResponse>("/api/messages", {
      params,
    });
    return res.data;
  }

  async sendMessage({
    roomId,
    text,
    fileData,
    fileName,
    fileType,
    replyTo,
    userId,
  }: {
    roomId: string;
    text: string;
    fileData?: string;
    fileName?: string;
    fileType?: string;
    replyTo?: string;
    userId: string;
  }) {
    const body: {
      text: string;
      fileData?: string;
      fileName?: string;
      fileType?: string;
      replyTo?: string;
    } = { text };
    if (fileData) body.fileData = fileData;
    if (fileName) body.fileName = fileName;
    if (fileType) body.fileType = fileType;
    if (replyTo) body.replyTo = replyTo;
    return await axios.post(
      `/api/messages?userId=${userId}&roomId=${roomId}`,
      body
    );
  }

  async deleteMessage(id: string, userId: string) {
    const res = await axios.delete(`/api/messages/${id}`, {
      params: { userId },
    });
    return res.data;
  }
}

const chatApiService = new ChatApiService();
export default chatApiService;
