import { WsResponse, WebSocketEventName } from "@web/types/websocket";
import { Message, ChatRoom } from "@web/types/chat";

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
