// WebSocket Response interface
export interface WsResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  code?: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId:
    | {
        _id: string;
        email: string;
        username?: string;
        avatar?: string;
      }
    | string;
  text: string;
  fileUrl?: string;
  replyTo?: unknown;
  mentions: string[];
  isPinned: boolean;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoomMemberInfo {
  userId: string;
  name: string;
  avatarURL?: string;
}

export interface LastMessageInfo {
  messageId: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
}

export interface ChatRoom {
  roomId: string;
  name: string;
  isGroup: boolean;
  members: RoomMemberInfo[];
  lastMessage: LastMessageInfo | null;
  unreadCount: number;
  onlineMemberIds: string[];
}

export interface MessagesResponse {
  data: Message[];
  hasMore: boolean;
  before?: string;
}
