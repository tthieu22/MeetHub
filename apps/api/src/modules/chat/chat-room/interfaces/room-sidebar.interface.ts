export interface RoomInfo {
  roomId: string;
  name: string;
  type: string;
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
  createdAt: Date;
}

export interface RoomSidebarInfo {
  roomId: string;
  name: string;
  isGroup: boolean;
  members: RoomMemberInfo[];
  lastMessage: LastMessageInfo | null;
  unreadCount: number;
  onlineMemberIds: string[];
}

export type PopulatedUser = { _id: { toString(): string }; name?: string; avatarURL?: string };
