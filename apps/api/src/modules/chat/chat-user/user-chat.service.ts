import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../users/schema/user.schema';
import { UserRelationshipService } from './user-relationship.service';

export interface UserProfile {
  userId: string;
  name: string;
  email: string;
  avatar?: string | null;
  chated?: boolean;
  roomId?: string | null;
}

@Injectable()
export class UserChatService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private userRelationshipService: UserRelationshipService,
  ) {}

  async getAllUsers(
    page: number = 1,
    limit: number = 20,
    search?: string,
    currentUserId?: string,
  ): Promise<{
    success: boolean;
    data: UserProfile[];
    total: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    message?: string;
  }> {
    try {
      const validPage = Math.max(1, page);
      const validLimit = Math.min(Math.max(1, limit), 100);
      const skip = (validPage - 1) * validLimit;

      const query: Record<string, any> = {};
      if (search && search.trim()) {
        const searchRegex = new RegExp(search.trim(), 'i');
        query.$or = [{ name: searchRegex }, { email: searchRegex }];
      }

      const total = await this.userModel.countDocuments(query);

      const users = await this.userModel.find(query).select('_id name email avatarURL').sort({ name: 1 }).skip(skip).limit(validLimit).lean().exec();
      // Note: relatedUserIds is no longer used since we check directly with getPrivateRoomId

      // Lấy roomId cho từng user đã chat
      const userProfiles = await Promise.all(
        users.map(async (user) => {
          const userId = user._id.toString();

          // Kiểm tra trực tiếp xem có private conversation không
          let hasChatted = false;
          let roomId: string | null = null;

          if (currentUserId) {
            try {
              roomId = await this.userRelationshipService.getPrivateRoomId(currentUserId, userId);
              hasChatted = !!roomId; // Nếu có roomId thì đã chat

              // Debug: Log detailed info
            } catch (error) {
              console.error(`Error checking chat status for user ${userId}:`, error);
            }
          }

          const userProfile = {
            userId,
            name: user.name || 'Unknown User',
            email: user.email,
            avatar: user.avatarURL || null,
            chated: hasChatted,
            roomId,
          };

          return userProfile;
        }),
      );

      const totalPages = Math.ceil(total / validLimit);
      const hasNextPage = validPage < totalPages;
      const hasPrevPage = validPage > 1;

      return {
        success: true,
        data: userProfiles,
        total,
        totalPages,
        currentPage: validPage,
        hasNextPage,
        hasPrevPage,
        message: `Successfully retrieved ${userProfiles.length} users (page ${validPage} of ${totalPages})`,
      };
    } catch (error: any) {
      console.error('Error getting all users:', error);
      return {
        success: false,
        data: [],
        total: 0,
        totalPages: 0,
        currentPage: page,
        hasNextPage: false,
        hasPrevPage: false,
        message: `Failed to retrieve users: ${error || 'Unknown error'}`,
      };
    }
  }

  blockUser(userId: string, targetUserId: string) {
    // TODO: Implement logic to block user
    return { userId, targetUserId, blocked: true };
  }

  unblockUser(userId: string, targetUserId: string) {
    // TODO: Implement logic to unblock user
    return { userId, targetUserId, blocked: false };
  }

  getBlockedUsers(userId: string): Promise<{ userId: string; blocked: boolean }[]> {
    // TODO: Implement logic to get blocked users
    return Promise.resolve([{ userId, blocked: true }]);
  }

  updateUser(userId: string, data: { name?: string; email?: string }): Promise<{ userId: string; name?: string; email?: string }> {
    // TODO: Implement logic to update user
    return Promise.resolve({ userId, name: data.name, email: data.email });
  }

  deleteUser(userId: string): Promise<{ deleted: boolean; userId: string }> {
    // TODO: Implement logic to delete user
    return Promise.resolve({ deleted: true, userId });
  }

  getUserById(userId: string): Promise<{ userId: string }> {
    // TODO: Implement logic to get user by id
    return Promise.resolve({ userId });
  }
}
