import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../users/schema/user.schema';

/**
 * Optimized User Search Service
 *
 * Required MongoDB indexes for optimal performance:
 * 1. Compound index: { isActive: 1, name: 1 }
 * 2. Text index: { name: "text", email: "text" } (optional, for better text search)
 *
 * Create indexes:
 * db.users.createIndex({ "isActive": 1, "name": 1 })
 * db.users.createIndex({ "name": "text", "email": "text" })
 */

export interface UserProfile {
  userId: string;
  name: string;
  email: string;
  avatar?: string | null;
}

@Injectable()
export class UserChatService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async getAllUsers(
    page: number = 1,
    limit: number = 20,
    search?: string,
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
      // Validate parameters
      const validPage = Math.max(1, page);
      const validLimit = Math.min(Math.max(1, limit), 100); // Max 100 per page
      const skip = (validPage - 1) * validLimit;

      // Build query with search functionality
      const query: Record<string, any> = {};
      if (search && search.trim()) {
        const searchRegex = new RegExp(search.trim(), 'i');
        query.$or = [{ name: searchRegex }, { email: searchRegex }];
      }

      // Get total count for pagination
      const total = await this.userModel.countDocuments(query);

      // Get paginated users with optimized field selection
      const users = await this.userModel.find(query).select('_id name email avatarURL').sort({ name: 1 }).skip(skip).limit(validLimit).lean().exec();

      const userProfiles = users.map((user) => ({
        userId: user._id.toString(),
        name: user.name || 'Unknown User',
        email: user.email,
        avatar: user.avatarURL || null,
      }));

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
        message: `Failed to retrieve users: ${error?.message || 'Unknown error'}`,
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
