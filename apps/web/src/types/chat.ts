// WebSocket Message Types
export interface SocketMessageData {
  text: string;
  senderId: string;
  roomId: string;
}

export interface MessageError {
  error: string;
  originalData: SocketMessageData;
}

export interface RoomData {
  roomId: string;
  name?: string;
  type?: string;
}

export interface NotificationData {
  id: string;
  type: string;
  message: string;
  roomId?: string;
}

export interface ReactionData {
  messageId: string;
  reaction: string;
}

export interface MessageReadData {
  messageId: string;
}

export interface MessageDeletedData {
  messageId: string;
}

// Chat Service Event Types
export interface ChatEvents {
  "chat:message:new": SocketMessageData;
  "chat:message:saved": SocketMessageData;
  "chat:message:error": MessageError;
  "chat:message:deleted": MessageDeletedData;
  "chat:reaction:updated": ReactionData;
  "chat:room:updated": RoomData;
  "chat:room:joined": RoomData;
  "chat:room:left": RoomData;
  "chat:notification:new": NotificationData;
  "chat:message:read": MessageReadData;
}

// User Online Types
export interface OnlineUser {
  userId: string;
  clientId: string;
  lastSeen: string;
}

export interface OnlineUsersResponse {
  success: boolean;
  data: string[];
  message?: string;
}

// Chat Room Types
export interface ChatRoom {
  _id: string;
  name: string;
  type: "private" | "group";
  creatorId: string;
  members: RoomMember[];
  lastMessage?: {
    content?: string;
    createdAt?: string;
  };
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface RoomMember {
  userId: string;
  role: "admin" | "member";
  joinedAt: string;
  user: User;
}

// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: string;
}

// Message Types
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender: User;
  text: string;
  fileUrl?: string;
  replyTo?: string;
  mentions: string[];
  isPinned: boolean;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
}

// Store Message Types (for Zustand store)
export interface StoreMessage {
  id: string;
  text: string;
  senderId: string;
  roomId: string;
  createdAt: string;
  reactions?: Record<string, string[]>;
  isRead?: boolean;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Request Types
export interface CreateMessageRequest {
  text?: string;
  fileUrl?: string;
  replyTo?: string;
  mentions?: string[];
}

export interface CreateRoomRequest {
  name: string;
  type: "private" | "group";
  members?: string[];
}

export interface UpdateRoomRequest {
  name?: string;
  description?: string;
  avatar?: string;
}

export interface AddReactionRequest {
  emoji: string;
}

// Socket Connection Types
export interface SocketConnection {
  connected: boolean;
  id?: string;
}

// Chat State Types
export interface ChatState {
  messages: StoreMessage[];
  rooms: ChatRoom[];
  notifications: NotificationData[];
  onlineUsers: string[];
  currentRoom?: string;
  loading: boolean;
  error?: string;
}
