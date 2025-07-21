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

export interface RoomMemberDetail {
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  joinedAt: Date;
}

export interface RoomCreatorInfo {
  userId: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface RoomDetailInfo {
  _id: string;
  name: string;
  type: string;
  creatorId: string;
  isDeleted: boolean;
  deletedAt?: Date;
  lastMessage?: {
    content: string;
    createdAt: Date;
    senderId: string;
  };
  memberIds: string[];
  assignedAdmins: string[];
  currentAdminId?: string;
  lastAdminReplyAt?: Date;
  isTemporary: boolean;
  isActive: boolean;
  pending: boolean;
  createdAt: Date;
  updatedAt: Date;
  members: RoomMemberDetail[];
  creator: RoomCreatorInfo | null;
}
