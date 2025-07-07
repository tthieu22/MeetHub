import { apiClient } from "../client";
import { MessageReaction, AddReactionRequest } from "../types";

export class ReactionService {
  // 6. Thả emoji hoặc bỏ emoji
  static async addReaction(
    messageId: string,
    data: AddReactionRequest
  ): Promise<void> {
    await apiClient.post(`/messages/${messageId}/reactions`, data);
  }

  // 7. Lấy toàn bộ emoji trong 1 tin nhắn
  static async getMessageReactions(
    messageId: string
  ): Promise<MessageReaction[]> {
    const response = await apiClient.get<MessageReaction[]>(
      `/messages/${messageId}/reactions`
    );
    return response.data;
  }
}
