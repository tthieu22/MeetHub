// WebSocket event constants - match với backend
export const WS_EVENTS = {
  // Client to Server events
  GET_ROOMS: "get_rooms",
  GET_MESSAGES: "get_messages",
  CREATE_MESSAGE: "create_message",
  MARK_ROOM_READ: "mark_room_read",
  GET_UNREAD_COUNT: "get_unread_count",
  JOIN_ROOM: "join_room",
} as const;

// Server to Client events - match với backend WebSocketEventName
export const WS_RESPONSE_EVENTS = {
  ERROR: "error",
  AUTH_ERROR: "auth_error",
  CONNECTION_SUCCESS: "connection_success",
  ROOMS: "rooms",
  MESSAGES: "messages",
  MARK_ROOM_READ_SUCCESS: "mark_room_read_success",
  ROOM_MARKED_READ: "room_marked_read",
  UNREAD_COUNT: "unread_count",
  UNREAD_COUNT_UPDATED: "unread_count_updated",
  MESSAGE_CREATED: "message_created",
  NEW_MESSAGE: "new_message",
  ROOM_JOINED: "room_joined",
  USER_ONLINE: "user_online",
  USER_OFFLINE: "user_offline",
} as const;

// WebSocket configuration
export const WS_CONFIG = {
  URL: process.env.NEXT_PUBLIC_WS_URL || "http://localhost:8000",
  TRANSPORTS: ["websocket"] as const,
  AUTO_CONNECT: true,
  RECONNECTION: true,
  RECONNECTION_ATTEMPTS: 5,
  RECONNECTION_DELAY: 1000,
} as const;
