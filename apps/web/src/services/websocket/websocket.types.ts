import { WsResponse, WebSocketEventName } from "@web/types/websocket";
import { Message, ChatRoom, UsersOnline } from "@web/types/chat";

// WebSocket service interface
export interface WebSocketServiceInterface {
  connect(token: string): Promise<void>;
  disconnect(): void;
  isConnected(): boolean;

  // Event emitters
  emitGetRooms(): void;
  emitGetMessages(roomId: string, before?: string): void;
  emitCreateMessage(roomId: string, text: string): void;
  emitMarkRoomRead(roomId: string): void;
  emitGetUnreadCount(roomId: string): void;
  emitJoinRoom(roomId: string): void;
  // ===== Support/Admin event emitters =====
  emitUserRequestSupport(): void; // Emit yêu cầu hỗ trợ tới admin
  emitAdminJoinSupportRoom(roomId: string): void; // Admin join vào phòng support
  emitCloseSupportRoom(roomId: string): void; // Đóng phòng support
  emitClientLeaveRoom(roomId: string): void; // Client rời phòng
  emitClientDeleteRoom(roomId: string): void; // Client xoá phòng

  // Event listeners
  onConnectionSuccess(
    callback: (data: WsResponse<{ userId: string; rooms: string[] }>) => void
  ): void;
  onRooms(callback: (data: WsResponse<ChatRoom[]>) => void): void;
  onMessages(
    callback: (
      data: WsResponse<{ data: Message[]; hasMore: boolean; before?: string }>
    ) => void
  ): void;
  onNewMessage(callback: (data: WsResponse<Message>) => void): void;
  onUnreadCountUpdated(
    callback: (
      data: WsResponse<{ roomId: string; unreadCount: number }>
    ) => void
  ): void;
  onUserOnline(
    callback: (data: WsResponse<{ userId: string; roomId: string }>) => void
  ): void;
  onUserOffline(
    callback: (data: WsResponse<{ userId: string; roomId: string }>) => void
  ): void;
  onError(callback: (data: WsResponse) => void): void;
  onAuthError(callback: (data: WsResponse) => void): void;
  onRoomDeleted(
    callback: (data: { roomId: string; message: string }) => void
  ): void;
  onRoomLeft(
    callback: (data: { roomId: string; message: string }) => void
  ): void;
  // ===== Support/Admin event listeners =====
  onSupportRoomPending(callback: () => void): void; // Khi phòng support đang pending (chưa có admin)
  onSupportRoomAssigned(
    callback: (data: {
      roomId: string;
      admin?: { name?: string; _id?: string };
    }) => void
  ): void; // Khi user được gán admin
  onSupportAdminJoined(
    callback: (data: {
      roomId: string;
      admin?: { name?: string; _id?: string };
    }) => void
  ): void; // Khi admin join vào phòng
  onSupportTicketAssigned(
    callback: (data: { roomId: string; userId: string }) => void
  ): void; // Khi admin nhận ticket hỗ trợ
  onSupportAdminChanged(
    callback: (data: {
      roomId: string;
      userId: string;
      newAdminId: string;
    }) => void
  ): void; // Khi admin bị đổi do timeout

  // Remove listeners
  off(event: WebSocketEventName): void;
  offAll(): void;
}

// WebSocket connection options
export interface WebSocketConnectionOptions {
  token: string;
  url?: string;
  transports?: string[];
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

// WebSocket event handlers
export interface WebSocketEventHandlers {
  onConnectionSuccess?: (
    data: WsResponse<{ userId: string; rooms: string[] }>
  ) => void;
  onRooms?: (data: WsResponse<ChatRoom[]>) => void;
  onMessages?: (
    data: WsResponse<{ data: Message[]; hasMore: boolean; before?: string }>
  ) => void;
  onNewMessage?: (data: WsResponse<Message>) => void;
  onUnreadCountUpdated?: (
    data: WsResponse<{ roomId: string; unreadCount: number }>
  ) => void;
  onUserOnline?: (data: WsResponse<{ userId: string; roomId: string }>) => void;
  onUserOffline?: (
    data: WsResponse<{ userId: string; roomId: string }>
  ) => void;
  onError?: (data: WsResponse) => void;
  onAuthError?: (data: WsResponse) => void;
  // ===== Room event listeners =====
  onRoomOnlineMembers?: (
    data: WsResponse<{ roomId: string; onlineMemberIds: string[] }>
  ) => void;
  onRoomMarkedRead?: (data: WsResponse<{ roomId: string }>) => void;
  onRoomDeleted?: (data: { roomId: string; message: string }) => void;
  onRoomLeft?: (data: { roomId: string; message: string }) => void;
  // ===== User event listeners =====
  onAllOnlineUsers?: (data: WsResponse<UsersOnline[]>) => void;
  // ===== Support/Admin event listeners =====
  onSupportRoomPending?: () => void;
  onSupportRoomAssigned?: (data: {
    roomId: string;
    admin?: { name?: string; _id?: string };
  }) => void;
  onSupportAdminJoined?: (data: {
    roomId: string;
    admin?: { name?: string; _id?: string };
  }) => void;
  onSupportTicketAssigned?: (data: { roomId: string; userId: string }) => void;
  onSupportAdminChanged?: (data: {
    roomId: string;
    userId: string;
    newAdminId: string;
  }) => void;
}

// WebSocket service configuration
export interface WebSocketServiceConfig {
  url: string;
  transports: string[];
  autoConnect: boolean;
  reconnection: boolean;
  reconnectionAttempts: number;
  reconnectionDelay: number;
}
