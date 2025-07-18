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
        name?: string;
      }
    | string;
  text: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  senderEmail?: string;
  senderName?: string;
  reactions?: {
    userId: string;
    emoji: string;
  }[];
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
  email: string;
  avatarURL?: string;
}

export interface LastMessageInfo {
  messageId: string;
  conversationId: string;
  senderId: string;
  text: string;
  senderEmail?: string;
  senderName?: string;
  createdAt: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
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

export interface ChatRoomDetailedInfo {
  _id: string;
  roomId: string;
  name: string;
  type: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  isGroup: boolean;
  isActive: boolean;
  isDeleted: boolean;
  members: Array<{
    userId: string;
    name: string;
    email: string;
    avatarURL: string;
    role: string;
    isOnline: boolean;
    joinedAt: string;
  }>;
  memberCount: number;
  lastMessage?: LastMessageInfo | null;
  unreadCount: number;
  totalMessages: number;
  userRole: string | null;
  onlineMemberIds: string[];
  onlineCount: number;
}

export interface MessagesResponse {
  data: Message[];
  hasMore: boolean;
  before?: string;
}
export interface UsersOnline {
  userId: string;
  name: string;
  email: string;
  avatarURL?: string;
  isOnline: boolean;
}
