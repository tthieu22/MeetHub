import { Injectable } from '@nestjs/common';
import { OnlineUsersService } from './online-users.service';

@Injectable()
export class TokenOnlineService {
  constructor(private onlineUsersService: OnlineUsersService) {}

  // Decode JWT token (simple base64 decode)
  private decodeJWT(token: string): Record<string, any> | null {
    try {
      // Remove 'Bearer ' prefix if present
      const cleanToken = token.replace('Bearer ', '');

      // Split token and get payload
      const parts = cleanToken.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }

      // Decode base64 payload
      const payload = Buffer.from(parts[1], 'base64').toString('utf8');
      return JSON.parse(payload) as Record<string, any>;
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return null;
    }
  }

  // Get user ID from token
  private getUserIdFromToken(token: string): string | null {
    try {
      const decoded = this.decodeJWT(token);
      if (!decoded) return null;

      // Try different possible field names for user ID
      return ((decoded.userId || decoded.sub || decoded.id) as string) || null;
    } catch (error) {
      console.error('Error getting user ID from token:', error);
      return null;
    }
  }

  // Main function: decode token and add user to online list
  addUserOnlineFromToken(token: string, clientId: string): { success: boolean; userId?: string; message: string } {
    try {
      console.log('Processing token for online status...');

      // Get user ID from token
      const userId = this.getUserIdFromToken(token);
      if (!userId) {
        return {
          success: false,
          message: 'Invalid token or user ID not found',
        };
      }

      console.log(`User ID extracted from token: ${userId}`);

      // Add user to online list
      this.onlineUsersService.addOnlineUser(clientId, userId);

      console.log(`User ${userId} added to online list for client ${clientId}`);

      return {
        success: true,
        userId,
        message: 'User added to online list successfully',
      };
    } catch (error) {
      console.error('Error adding user online from token:', error);
      return {
        success: false,
        message: 'Error processing token',
      };
    }
  }

  // Remove user from online list
  removeUserOnline(clientId: string): { success: boolean; userId?: string; message: string } {
    try {
      const userId = this.onlineUsersService.removeOnlineUser(clientId);
      if (userId) {
        console.log(`User ${userId} removed from online list for client ${clientId}`);
        return {
          success: true,
          userId,
          message: 'User removed from online list successfully',
        };
      } else {
        return {
          success: false,
          message: 'User not found in online list',
        };
      }
    } catch (error) {
      console.error('Error removing user from online list:', error);
      return {
        success: false,
        message: 'Error removing user from online list',
      };
    }
  }

  // Get current online users
  getOnlineUsers(): string[] {
    return this.onlineUsersService.getOnlineUsers();
  }

  // Chỉ lấy user ID từ token (không thêm vào online list)
  extractUserIdFromToken(token: string): { success: boolean; userId?: string; message: string } {
    try {
      console.log('Getting user ID from token...');

      const userId = this.getUserIdFromToken(token);
      if (!userId) {
        return {
          success: false,
          message: 'Invalid token or user ID not found',
        };
      }

      console.log(`User ID extracted from token: ${userId}`);

      return {
        success: true,
        userId,
        message: 'User ID extracted successfully',
      };
    } catch (error) {
      console.error('Error getting user ID from token:', error);
      return {
        success: false,
        message: 'Error processing token',
      };
    }
  }
}
