// Match với backend WebSocketEventName
export enum WebSocketEventName {
  ERROR = "error",
  AUTH_ERROR = "auth_error",
  CONNECTION_SUCCESS = "connection_success",
  ROOMS = "rooms",
  MESSAGES = "messages",
  MARK_ROOM_READ_SUCCESS = "mark_room_read_success",
  ROOM_MARKED_READ = "room_marked_read",
  UNREAD_COUNT = "unread_count",
  UNREAD_COUNT_UPDATED = "unread_count_updated",
  MESSAGE_CREATED = "message_created",
  NEW_MESSAGE = "new_message",
  ROOM_JOINED = "room_joined",
  USER_ONLINE = "user_online",
  USER_OFFLINE = "user_offline",
}

// Match với backend WsResponse interface
export interface WsResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  code?: string;
}

// WebSocket connection status
export enum ConnectionStatus {
  DISCONNECTED = "disconnected",
  CONNECTING = "connecting",
  CONNECTED = "connected",
  ERROR = "error",
}

// WebSocket error types
export interface WebSocketError {
  code: string;
  message: string;
}

// Connection success response
export interface ConnectionSuccessData {
  userId: string;
  rooms: string[];
}

// User online/offline data
export interface UserStatusData {
  userId: string;
  roomId: string;
}

// Unread count data
export interface UnreadCountData {
  roomId: string;
  unreadCount: number;
}
