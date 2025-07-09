import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConversationMember, ConversationMemberDocument } from '../chat-room/schema/conversation-member.schema';
import { Conversation, ConversationDocument } from '../chat-room/schema/chat-room.schema';

export interface UserRelationship {
  userId: string;
  relatedUserId: string;
  relationshipType: 'room_member' | 'direct_chat';
  roomId?: string;
}

@Injectable()
export class UserRelationshipService {
  constructor(
    @InjectModel(ConversationMember.name) private conversationMemberModel: Model<ConversationMemberDocument>,
    @InjectModel(Conversation.name) private conversationModel: Model<ConversationDocument>,
  ) {}

  /**
   * Lấy danh sách user có quan hệ với user hiện tại
   */
  async getRelatedUsers(userId: string): Promise<string[]> {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        return [];
      }

      // Lấy tất cả conversation mà user tham gia
      const userConversations = await this.conversationMemberModel
        .find({ userId: new Types.ObjectId(userId) })
        .select('conversationId')
        .exec();

      const conversationIds = userConversations.map((member) => member.conversationId);

      if (conversationIds.length === 0) {
        return [];
      }

      // Lấy tất cả user khác trong các conversation này
      const relatedMembers = await this.conversationMemberModel
        .find({
          conversationId: { $in: conversationIds },
          userId: { $ne: new Types.ObjectId(userId) },
        })
        .select('userId')
        .exec();

      // Lấy unique user IDs
      const relatedUserIds = [...new Set(relatedMembers.map((member) => member.userId.toString()))];

      return relatedUserIds;
    } catch (error) {
      console.error('Error getting related users:', error);
      return [];
    }
  }

  /**
   * Kiểm tra xem 2 user có quan hệ với nhau không
   */
  async areUsersRelated(userId1: string, userId2: string): Promise<boolean> {
    try {
      if (!Types.ObjectId.isValid(userId1) || !Types.ObjectId.isValid(userId2)) {
        return false;
      }

      // Tìm conversation chung giữa 2 user
      const user1Conversations = await this.conversationMemberModel
        .find({ userId: new Types.ObjectId(userId1) })
        .select('conversationId')
        .exec();

      const user1ConversationIds = user1Conversations.map((member) => member.conversationId);

      if (user1ConversationIds.length === 0) {
        return false;
      }

      // Kiểm tra xem user2 có trong conversation nào của user1 không
      const commonConversation = await this.conversationMemberModel
        .findOne({
          userId: new Types.ObjectId(userId2),
          conversationId: { $in: user1ConversationIds },
        })
        .exec();

      return !!commonConversation;
    } catch (error) {
      console.error('Error checking user relationship:', error);
      return false;
    }
  }

  /**
   * Lấy danh sách conversation chung giữa 2 user
   */
  async getCommonConversations(userId1: string, userId2: string): Promise<string[]> {
    try {
      if (!Types.ObjectId.isValid(userId1) || !Types.ObjectId.isValid(userId2)) {
        return [];
      }

      // Lấy conversation của user1
      const user1Conversations = await this.conversationMemberModel
        .find({ userId: new Types.ObjectId(userId1) })
        .select('conversationId')
        .exec();

      const user1ConversationIds = user1Conversations.map((member) => member.conversationId);

      if (user1ConversationIds.length === 0) {
        return [];
      }

      // Lấy conversation chung
      const commonConversations = await this.conversationMemberModel
        .find({
          userId: new Types.ObjectId(userId2),
          conversationId: { $in: user1ConversationIds },
        })
        .select('conversationId')
        .exec();

      return commonConversations.map((member) => member.conversationId.toString());
    } catch (error) {
      console.error('Error getting common conversations:', error);
      return [];
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
