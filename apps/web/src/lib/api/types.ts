// Re-export types from central types file
export { User, ChatRoom, RoomMember, Message } from "@web/types/chat";

export interface MessageFile {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
}

export interface MessageReaction {
  id: string;
  emoji: string;
  userId: string;
  user: User;
  createdAt: string;
}

// Notification types
export interface Notification {
  id: string;
  type: "message" | "mention" | "reaction" | "room_invite";
  title: string;
  message: string;
  roomId?: string;
  messageId?: string;
  isRead: boolean;
  createdAt: string;
}

// API Response types
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

// Request types
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

export interface UploadFileRequest {
  file: File;
  messageId: string;
}
