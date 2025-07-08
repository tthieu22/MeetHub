import { getSocket } from "../socket";
import {
  StoreMessage,
  SocketMessageData,
  MessageError,
  RoomData,
  NotificationData,
  ReactionData,
  MessageReadData,
  MessageDeletedData,
  ChatRoom,
} from "@web/types/chat";
import type { Message } from "@web/types/chat";

export class ChatService {
  public socket = getSocket();

  /**
   * Gửi tin nhắn mới
   */
  async sendMessage(
    content: string,
    senderId: string,
    roomId: string
  ): Promise<StoreMessage> {
    if (!roomId || !senderId) {
      throw new Error("Room ID và Sender ID là bắt buộc");
    }

    // Tạo tin nhắn tạm thời để hiển thị ngay lập tức
    const tempMessage: StoreMessage = {
      id: `temp-${Date.now()}`,
      text: content,
      senderId,
      roomId,
      createdAt: new Date().toISOString(),
      reactions: {},
      isRead: false,
    };

    // Gửi tin nhắn qua WebSocket
    const socketMessage: SocketMessageData = {
      text: content,
      senderId,
      roomId,
    };

    console.log("Sending message via WebSocket:", socketMessage);
    this.socket.emit("chat:message:new", socketMessage);
    console.log("Message sent via WebSocket");

    return tempMessage;
  }

  /**
   * Join room
   */
  joinRoom(roomId: string): void {
    console.log("Joining room:", roomId);
    this.socket.emit("chat:room:joined", { roomId });
  }

  /**
   * Leave room
   */
  leaveRoom(roomId: string): void {
    console.log("Leaving room:", roomId);
    this.socket.emit("chat:room:left", { roomId });
  }

  /**
   * Join socket.io room
   */
  joinRoomSocket(roomId: string) {
    this.socket.emit("joinRoom", { roomId });
  }

  /**
   * Leave socket.io room
   */
  leaveRoomSocket(roomId: string) {
    this.socket.emit("leaveRoom", { roomId });
  }

  /**
   * Xóa tin nhắn
   */
  deleteMessage(messageId: string): void {
    this.socket.emit("chat:message:deleted", { messageId });
  }

  /**
   * Cập nhật reaction
   */
  updateReaction(messageId: string, reaction: string): void {
    this.socket.emit("chat:reaction:updated", { messageId, reaction });
  }

  /**
   * Đánh dấu đã đọc
   */
  markAsRead(messageId: string): void {
    this.socket.emit("chat:message:read", { messageId });
  }

  /**
   * Lắng nghe sự kiện tin nhắn mới
   */
  onNewMessage(callback: (msg: Message) => void): void {
    this.socket.on("chat:message:new", callback);
  }

  /**
   * Bỏ lắng nghe tin nhắn mới
   */
  offNewMessage(callback: (msg: Message) => void): void {
    this.socket.off("chat:message:new", callback);
  }

  /**
   * Lắng nghe confirmation tin nhắn đã lưu
   */
  onMessageSaved(callback: (message: StoreMessage) => void): void {
    this.socket.on("chat:message:saved", (data) => {
      console.log("Message saved confirmation received:", data);
      callback(data);
    });
  }

  /**
   * Lắng nghe lỗi tin nhắn
   */
  onMessageError(callback: (error: MessageError) => void): void {
    this.socket.on("chat:message:error", (data) => {
      console.error("Message error received:", data);
      callback(data);
    });
  }

  /**
   * Lắng nghe tin nhắn bị xóa
   */
  onMessageDeleted(callback: (data: MessageDeletedData) => void): void {
    this.socket.on("chat:message:deleted", (data) => {
      callback(data);
    });
  }

  /**
   * Lắng nghe cập nhật reaction
   */
  onReactionUpdated(callback: (data: ReactionData) => void): void {
    this.socket.on("chat:reaction:updated", (data) => {
      callback(data);
    });
  }

  /**
   * Lắng nghe cập nhật room
   */
  onRoomUpdated(callback: (data: ChatRoom) => void): void {
    this.socket.on("chat:room:updated", (data: ChatRoom) => {
      callback(data);
    });
  }

  /**
   * Lắng nghe user join room
   */
  onRoomJoined(callback: (data: RoomData) => void): void {
    this.socket.on("chat:room:joined", (data) => {
      console.log("User joined room:", data);
      callback(data);
    });
  }

  /**
   * Lắng nghe user leave room
   */
  onRoomLeft(callback: (data: RoomData) => void): void {
    this.socket.on("chat:room:left", (data) => {
      console.log("User left room:", data);
      callback(data);
    });
  }

  /**
   * Lắng nghe notification mới
   */
  onNotificationNew(callback: (data: NotificationData) => void): void {
    this.socket.on("chat:notification:new", (data) => {
      callback(data);
    });
  }

  /**
   * Lắng nghe tin nhắn đã đọc
   */
  onMessageRead(callback: (data: MessageReadData) => void): void {
    this.socket.on("chat:message:read", (data) => {
      callback(data);
    });
  }

  /**
   * Lắng nghe sự kiện đã join room thành công
   */
  onJoinedRoom(callback: (data: { roomId: string }) => void): void {
    this.socket.on("joinedRoom", callback);
  }

  /**
   * Cleanup tất cả event listeners
   */
  cleanup(): void {
    this.socket.off("chat:message:new");
    this.socket.off("chat:message:saved");
    this.socket.off("chat:message:error");
    this.socket.off("chat:message:deleted");
    this.socket.off("chat:reaction:updated");
    this.socket.off("chat:room:updated");
    this.socket.off("chat:room:joined");
    this.socket.off("chat:room:left");
    this.socket.off("chat:notification:new");
    this.socket.off("chat:message:read");
    this.socket.off("joinedRoom");
  }
}

// Export singleton instance
export const chatService = new ChatService();
