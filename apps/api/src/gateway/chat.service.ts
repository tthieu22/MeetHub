import { Injectable, Inject } from '@nestjs/common';
import { MessageService } from '@api/modules/chat/chat-message/message.service';
import { RoomService } from '@api/modules/chat/chat-room/room.service';
import { UserChatService } from '@api/modules/chat/chat-user/user-chat.service';
import { ReactionService } from '@api/modules/chat/chat-reactions/reaction.service';
import { UsersService } from '@api/modules/users/users.service';
import { CreateMessageDto } from '@api/modules/chat/chat-message/dto/create-message.dto';
import { CreateRoomDto } from '@api/modules/chat/chat-room/dto/create-room.dto';
import { REDIS_CLIENT } from '@api/modules/redis';
import type Redis from 'ioredis';
import { RoomSidebarInfo } from '@api/modules/chat/chat-room/interfaces/room-sidebar.interface';

@Injectable()
export class ChatService {
  @Inject(REDIS_CLIENT) private readonly redisClient: Redis;

  constructor(
    private messageService: MessageService,
    private roomService: RoomService,
    private userChatService: UserChatService,
    private reactionService: ReactionService,
    private usersService: UsersService,
  ) {}

  // Message methods
  async createMessage(createMessageDto: CreateMessageDto, conversationId: string, userId: string) {
    return await this.messageService.createMessage(createMessageDto, userId, conversationId);
  }

  async getMessages(conversationId: string, page: number = 1, limit: number = 50, before?: Date) {
    return await this.messageService.getMessages(conversationId, page, limit, before);
  }

  async deleteMessage(messageId: string, userId: string) {
    return await this.messageService.deleteMessage(messageId, userId);
  }

  async togglePinMessage(messageId: string, userId: string) {
    return await this.messageService.togglePinMessage(messageId, userId);
  }

  async markAsRead(messageId: string, userId: string) {
    return await this.messageService.markAsRead(messageId, userId);
  }

  async markAllAsRead(conversationId: string, userId: string) {
    return await this.messageService.markAllAsRead(conversationId, userId);
  }

  async getUnreadCount(conversationId: string, userId: string) {
    return await this.messageService.getUnreadCount(conversationId, userId);
  }

  // Room methods
  async createRoom(createRoomDto: CreateRoomDto, userId: string) {
    return await this.roomService.createRoom(createRoomDto, userId);
  }

  async getRooms(userId: string) {
    return await this.roomService.getRooms(userId);
  }

  async getRoom(conversationId: string, userId: string) {
    return await this.roomService.getRoom(conversationId, userId);
  }

  async joinRoom(conversationId: string, userId: string) {
    return await this.roomService.joinRoom(conversationId, userId);
  }

  async leaveRoom(conversationId: string, userId: string) {
    return await this.roomService.leaveRoom(conversationId, userId);
  }

  async addMember(conversationId: string, newUserId: string, adminUserId: string) {
    return await this.roomService.addMember(conversationId, newUserId, adminUserId);
  }

  async removeMember(conversationId: string, memberUserId: string, adminUserId: string) {
    return await this.roomService.removeMember(conversationId, memberUserId, adminUserId);
  }

  async getRoomMembers(conversationId: string, userId: string) {
    return await this.roomService.getRoomMembers(conversationId, userId);
  }

  async getRoomSidebarInfo(userId: string): Promise<RoomSidebarInfo[]> {
    return this.roomService.getRoomSidebarInfo(userId);
  }

  async getBlockedUsers(userId: string) {
    return await this.userChatService.getBlockedUsers(userId);
  }

  async getOnlineMemberIds(roomId: string): Promise<string[]> {
    return this.roomService.getOnlineMemberIds(roomId);
  }

  async adminJoinRoom(roomId: string, adminId: string) {
    return await this.roomService.adminJoinRoom(roomId, adminId);
  }

  async closeSupportRoom(conversationId: string, closedBy: string) {
    return await this.roomService.closeSupportRoom(conversationId, closedBy);
  }

  // Reaction methods
  async addReaction(messageId: string, userId: string, reaction: string) {
    return await this.reactionService.addReaction(messageId, userId, reaction);
  }

  async removeReaction(messageId: string, userId: string, reaction: string) {
    return await this.reactionService.removeReaction(messageId, userId, reaction);
  }

  async getNotifications() {}

  /**
   * Đánh dấu user online trên Redis
   * @param userId string
   * @returns { success: boolean; userId: string; }
   */
  async setUserOnline(userId: string): Promise<{ success: boolean; userId: string }> {
    // Set với TTL 5 phút để tránh expire quá sớm
    await this.redisClient.setex(`user:online:${userId}`, 300, '1');

    // Verify the user was set online
    await this.redisClient.get(`user:online:${userId}`);

    return { success: true, userId };
  }

  /**
   * Refresh TTL cho user online
   * @param userId string
   */
  async refreshUserOnline(userId: string): Promise<void> {
    const isOnline = await this.redisClient.get(`user:online:${userId}`);
    if (isOnline === '1') {
      await this.redisClient.expire(`user:online:${userId}`, 300);
    }
  }

  // User info methods
  async getUser(userId: string) {
    return await this.usersService.findById(userId);
  }

  async getUsers() {
    return await this.usersService.findAll();
  }

  async validateRoomMembership(userId: string, roomId: string): Promise<boolean> {
    try {
      const room = await this.roomService.getRoom(roomId, userId);
      return !!room;
    } catch {
      return false;
    }
  }

  async assignAdminToUser(userId: string) {
    return await this.roomService.assignAdminToUser(userId);
  }

  async assignPendingRoomsToAdmins() {
    return await this.roomService.assignPendingRoomsToAdmins();
  }
}
