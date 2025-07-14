import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConversationMember, ConversationMemberDocument } from '../chat-room/schema/conversation-member.schema';
import { Conversation, ConversationDocument as ConversationSchema } from '../chat-room/schema/chat-room.schema';

export interface UserRelationship {
  userId: string;
  relatedUserId: string;
  relationshipType: 'room_member' | 'direct_chat';
  roomId?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
}

export interface UserWithRelationship {
  userId: string;
  name: string;
  email: string;
  avatar?: string | null;
  hasChatHistory: boolean;
  conversationCount: number;
  lastChatDate?: Date;
}

interface UserDocument {
  _id: string | { toString(): string };
  name?: string;
  email?: string;
  avatarURL?: string | null;
}

interface ConversationDocument {
  _id: string | { toString(): string };
  updatedAt?: Date;
}

@Injectable()
export class UserRelationshipService {
  constructor(
    @InjectModel(ConversationMember.name) private conversationMemberModel: Model<ConversationMemberDocument>,
    @InjectModel(Conversation.name) private conversationModel: Model<ConversationSchema>,
  ) {}

  /**
   * Kiểm tra xem 2 user có từng chat với nhau chưa
   * @param currentUserId - ID của user hiện tại
   * @param targetUserId - ID của user cần kiểm tra
   * @returns true nếu 2 user đã từng chat, false nếu chưa
   */
  async haveUsersChatted(currentUserId: string, targetUserId: string): Promise<boolean> {
    try {
      if (!Types.ObjectId.isValid(currentUserId) || !Types.ObjectId.isValid(targetUserId)) {
        return false;
      }

      // Tìm tất cả conversation mà current user tham gia
      const currentUserConversations = await this.conversationMemberModel
        .find({ userId: new Types.ObjectId(currentUserId) })
        .select('conversationId')
        .lean()
        .exec();

      if (currentUserConversations.length === 0) {
        return false;
      }

      const conversationIds = currentUserConversations.map((member) => member.conversationId);

      // Kiểm tra xem target user có trong conversation nào của current user không
      const commonConversation = await this.conversationMemberModel
        .findOne({
          userId: new Types.ObjectId(targetUserId),
          conversationId: { $in: conversationIds },
        })
        .lean()
        .exec();

      return !!commonConversation;
    } catch (error) {
      console.error('Error checking if users have chatted:', error);
      return false;
    }
  }

  /**
   * Lấy danh sách conversation chung giữa 2 user
   * @param currentUserId - ID của user hiện tại
   * @param targetUserId - ID của user cần kiểm tra
   * @returns Array các conversation ID chung
   */
  async getCommonConversations(currentUserId: string, targetUserId: string): Promise<string[]> {
    try {
      if (!Types.ObjectId.isValid(currentUserId) || !Types.ObjectId.isValid(targetUserId)) {
        return [];
      }

      // Tìm tất cả conversation mà current user tham gia
      const currentUserConversations = await this.conversationMemberModel
        .find({ userId: new Types.ObjectId(currentUserId) })
        .select('conversationId')
        .lean()
        .exec();

      if (currentUserConversations.length === 0) {
        return [];
      }

      const conversationIds = currentUserConversations.map((member) => member.conversationId);

      // Tìm conversation chung
      const commonConversations = await this.conversationMemberModel
        .find({
          userId: new Types.ObjectId(targetUserId),
          conversationId: { $in: conversationIds },
        })
        .select('conversationId')
        .lean()
        .exec();

      return commonConversations.map((member) => member.conversationId.toString());
    } catch (error) {
      console.error('Error getting common conversations:', error);
      return [];
    }
  }

  /**
   * Lấy danh sách user có quan hệ với user hiện tại (đã từng chat) - CÓ PAGINATION
   * @param currentUserId - ID của user hiện tại
   * @param params - Tham số pagination và search
   * @returns Danh sách user với thông tin relationship
   */
  async getRelatedUsersWithPagination(
    currentUserId: string,
    params: PaginationParams,
  ): Promise<{
    users: UserWithRelationship[];
    total: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }> {
    try {
      if (!Types.ObjectId.isValid(currentUserId)) {
        return {
          users: [],
          total: 0,
          totalPages: 0,
          currentPage: params.page,
          hasNextPage: false,
          hasPrevPage: false,
        };
      }

      const { page, limit, search } = params;
      const skip = (page - 1) * limit;

      // Lấy tất cả conversation mà user tham gia
      const userConversations = await this.conversationMemberModel
        .find({ userId: new Types.ObjectId(currentUserId) })
        .select('conversationId')
        .lean()
        .exec();

      const conversationIds = userConversations.map((member) => member.conversationId);

      if (conversationIds.length === 0) {
        return {
          users: [],
          total: 0,
          totalPages: 0,
          currentPage: page,
          hasNextPage: false,
          hasPrevPage: false,
        };
      }

      // Lấy tất cả user khác trong các conversation này
      const relatedMembers = await this.conversationMemberModel
        .find({
          conversationId: { $in: conversationIds },
          userId: { $ne: new Types.ObjectId(currentUserId) },
        })
        .select('userId')
        .lean()
        .exec();

      // Lấy unique user IDs
      const relatedUserIds = [...new Set(relatedMembers.map((member) => member.userId.toString()))];

      if (relatedUserIds.length === 0) {
        return {
          users: [],
          total: 0,
          totalPages: 0,
          currentPage: page,
          hasNextPage: false,
          hasPrevPage: false,
        };
      }

      // Tạo query để lấy thông tin user với search
      const userQuery: Record<string, any> = {
        _id: { $in: relatedUserIds.map((id) => new Types.ObjectId(id)) },
      };

      if (search && search.trim()) {
        const searchRegex = new RegExp(search.trim(), 'i');
        userQuery.$or = [{ name: searchRegex }, { email: searchRegex }];
      }

      // Lấy tổng số user thỏa mãn điều kiện
      const total = await this.conversationMemberModel.db.collection('users').countDocuments(userQuery);

      // Lấy danh sách user với pagination
      const users = await this.conversationMemberModel.db.collection('users').find(userQuery).project({ _id: 1, name: 1, email: 1, avatarURL: 1 }).skip(skip).limit(limit).sort({ name: 1 }).toArray();

      // Tạo danh sách user với thông tin relationship
      const usersWithRelationships: UserWithRelationship[] = await Promise.all(
        users.map(async (user: UserDocument) => {
          const conversationCount = await this.getCommonConversations(currentUserId, String(user._id));

          return {
            userId: String(user._id),
            name: String(user.name || 'Unknown User'),
            email: String(user.email || ''),
            avatar: user.avatarURL || null,
            hasChatHistory: true,
            conversationCount: conversationCount.length,
          };
        }),
      );

      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return {
        users: usersWithRelationships,
        total,
        totalPages,
        currentPage: page,
        hasNextPage,
        hasPrevPage,
      };
    } catch (error) {
      console.error('Error getting related users with pagination:', error);
      return {
        users: [],
        total: 0,
        totalPages: 0,
        currentPage: params.page,
        hasNextPage: false,
        hasPrevPage: false,
      };
    }
  }

  /**
   * Lấy danh sách user có quan hệ với user hiện tại (đã từng chat) - LEGACY METHOD
   * @param currentUserId - ID của user hiện tại
   * @returns Array các user ID đã từng chat
   */
  async getRelatedUsers(currentUserId: string): Promise<string[]> {
    try {
      if (!Types.ObjectId.isValid(currentUserId)) {
        return [];
      }

      // Lấy tất cả conversation mà user tham gia
      const userConversations = await this.conversationMemberModel
        .find({ userId: new Types.ObjectId(currentUserId) })
        .select('conversationId')
        .lean()
        .exec();

      const conversationIds = userConversations.map((member) => member.conversationId);

      if (conversationIds.length === 0) {
        return [];
      }

      // Lấy thông tin conversation để lọc chỉ private conversations
      const conversations = await this.conversationModel
        .find({
          _id: { $in: conversationIds },
          type: 'private',
        })
        .select('_id')
        .lean()
        .exec();

      const privateConversationIds = conversations.map((conv) => conv._id);

      if (privateConversationIds.length === 0) {
        return [];
      }

      // Lấy tất cả user khác trong các private conversation này
      const relatedMembers = await this.conversationMemberModel
        .find({
          conversationId: { $in: privateConversationIds },
          userId: { $ne: new Types.ObjectId(currentUserId) },
        })
        .select('userId conversationId')
        .lean()
        .exec();

      // Lọc chỉ những conversation có đúng 2 thành viên
      const validUserIds: string[] = [];
      for (const member of relatedMembers) {
        const memberCount = await this.conversationMemberModel
          .countDocuments({
            conversationId: member.conversationId,
          })
          .exec();

        if (memberCount === 2) {
          validUserIds.push(member.userId.toString());
        }
      }

      // Lấy unique user IDs
      const relatedUserIds = [...new Set(validUserIds)];

      return relatedUserIds;
    } catch (error) {
      console.error('Error getting related users:', error);
      return [];
    }
  }

  /**
   * Lấy thông tin chi tiết về mối quan hệ giữa 2 user
   * @param currentUserId - ID của user hiện tại
   * @param targetUserId - ID của user cần kiểm tra
   * @returns Thông tin chi tiết về mối quan hệ
   */
  async getUserRelationshipInfo(
    currentUserId: string,
    targetUserId: string,
  ): Promise<{
    haveChatted: boolean;
    commonConversations: string[];
    conversationCount: number;
    lastChatDate?: Date;
  }> {
    try {
      const haveChatted = await this.haveUsersChatted(currentUserId, targetUserId);
      const commonConversations = await this.getCommonConversations(currentUserId, targetUserId);

      let lastChatDate: Date | undefined;
      if (commonConversations.length > 0) {
        // Lấy thông tin conversation gần nhất
        const latestConversation = await this.conversationModel
          .findOne({ _id: { $in: commonConversations.map((id) => new Types.ObjectId(id)) } })
          .sort({ updatedAt: -1 })
          .select('updatedAt')
          .lean()
          .exec();

        if (latestConversation && (latestConversation as ConversationDocument)?.updatedAt) {
          lastChatDate = (latestConversation as ConversationDocument)?.updatedAt;
        }
      }

      return {
        haveChatted,
        commonConversations,
        conversationCount: commonConversations.length,
        lastChatDate,
      };
    } catch (error) {
      console.error('Error getting user relationship info:', error);
      return {
        haveChatted: false,
        commonConversations: [],
        conversationCount: 0,
      };
    }
  }

  async getPrivateRoomId(currentUserId: string, targetUserId: string): Promise<string | null> {
    try {
      if (!Types.ObjectId.isValid(currentUserId) || !Types.ObjectId.isValid(targetUserId)) {
        return null;
      }

      // Tìm tất cả conversation mà current user tham gia
      const currentUserConversations = await this.conversationMemberModel
        .find({ userId: new Types.ObjectId(currentUserId) })
        .select('conversationId')
        .lean()
        .exec();

      if (currentUserConversations.length === 0) {
        return null;
      }

      const conversationIds = currentUserConversations.map((member) => member.conversationId);

      // Tìm conversation chung giữa 2 user
      const commonConversation = await this.conversationMemberModel
        .findOne({
          userId: new Types.ObjectId(targetUserId),
          conversationId: { $in: conversationIds },
        })
        .select('conversationId')
        .lean()
        .exec();

      if (!commonConversation) {
        return null;
      }

      // Kiểm tra xem conversation có phải là private và có đúng 2 thành viên không
      const conversation = await this.conversationModel
        .findOne({
          _id: commonConversation.conversationId,
          type: 'private',
        })
        .lean()
        .exec();

      if (!conversation) {
        return null;
      }

      // Đếm số thành viên trong conversation
      const memberCount = await this.conversationMemberModel.countDocuments({ conversationId: commonConversation.conversationId }).exec();

      // Chỉ trả về roomId nếu là conversation private với đúng 2 thành viên
      if (memberCount === 2) {
        return commonConversation.conversationId.toString();
      }

      return null;
    } catch (error) {
      console.error('Error getting private room ID:', error);
      return null;
    }
  }

  /**
   * Lọc danh sách online users chỉ hiển thị những user có quan hệ
   */
  async filterOnlineUsersByRelationship(currentUserId: string, onlineUserIds: string[]): Promise<string[]> {
    try {
      if (onlineUserIds.length === 0) {
        return [];
      }

      const relatedUsers = await this.getRelatedUsers(currentUserId);

      // Chỉ trả về những user online có quan hệ với current user
      const filteredOnlineUsers = onlineUserIds.filter((userId) => relatedUsers.includes(userId));

      return filteredOnlineUsers;
    } catch (error) {
      console.error('Error filtering online users by relationship:', error);
      return [];
    }
  }
}
