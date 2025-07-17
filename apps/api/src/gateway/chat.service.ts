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

  // ================== Message methods ==================
  // Tạo tin nhắn mới trong phòng
  async createMessage(createMessageDto: CreateMessageDto, conversationId: string, userId: string) {
    return await this.messageService.createMessage(createMessageDto, userId, conversationId);
  }

  // Lấy danh sách tin nhắn của phòng
  async getMessages(conversationId: string, page: number = 1, limit: number = 50, before?: Date) {
    return await this.messageService.getMessages(conversationId, page, limit, before);
  }

  // Xóa tin nhắn (nếu có quyền)
  async deleteMessage(messageId: string, userId: string) {
    return await this.messageService.deleteMessage(messageId, userId);
  }

  // Ghim hoặc bỏ ghim tin nhắn
  async togglePinMessage(messageId: string, userId: string) {
    return await this.messageService.togglePinMessage(messageId, userId);
  }

  // Đánh dấu tin nhắn đã đọc
  async markAsRead(messageId: string, userId: string) {
    return await this.messageService.markAsRead(messageId, userId);
  }

  // Đánh dấu tất cả tin nhắn trong phòng đã đọc
  async markAllAsRead(conversationId: string, userId: string) {
    return await this.messageService.markAllAsRead(conversationId, userId);
  }

  // Lấy số lượng tin nhắn chưa đọc trong phòng
  async getUnreadCount(conversationId: string, userId: string) {
    return await this.messageService.getUnreadCount(conversationId, userId);
  }

  // ================== Room methods ==================
  // Tạo phòng chat mới
  async createRoom(createRoomDto: CreateRoomDto, userId: string) {
    return await this.roomService.createRoom(createRoomDto, userId);
  }

  // Lấy danh sách các phòng của user
  async getRooms(userId: string) {
    return await this.roomService.getRooms(userId);
  }

  // Lấy thông tin 1 phòng cụ thể
  async getRoom(conversationId: string, userId: string) {
    return await this.roomService.getRoom(conversationId, userId);
  }

  // User join vào phòng
  async joinRoom(conversationId: string, userId: string) {
    return await this.roomService.joinRoom(conversationId, userId);
  }

  // User rời khỏi phòng
  async leaveRoom(conversationId: string, userId: string) {
    return await this.roomService.leaveRoom(conversationId, userId);
  }

  // Thêm thành viên vào phòng (admin)
  async addMember(conversationId: string, newUserId: string, adminUserId: string) {
    return await this.roomService.addMember(conversationId, newUserId, adminUserId);
  }

  // Xóa thành viên khỏi phòng (admin)
  async removeMember(conversationId: string, memberUserId: string, adminUserId: string) {
    return await this.roomService.removeMember(conversationId, memberUserId, adminUserId);
  }

  // Lấy danh sách thành viên phòng
  async getRoomMembers(conversationId: string, userId: string) {
    return await this.roomService.getRoomMembers(conversationId, userId);
  }

  // Lấy thông tin sidebar các phòng
  async getRoomSidebarInfo(userId: string): Promise<RoomSidebarInfo[]> {
    return this.roomService.getRoomSidebarInfo(userId);
  }

  // Lấy danh sách user bị block
  async getBlockedUsers(userId: string) {
    return await this.userChatService.getBlockedUsers(userId);
  }

  // Lấy danh sách thành viên online trong phòng
  async getOnlineMemberIds(roomId: string): Promise<string[]> {
    return this.roomService.getOnlineMemberIds(roomId);
  }

  // Admin join vào phòng hỗ trợ
  async adminJoinRoom(roomId: string, adminId: string) {
    return await this.roomService.adminJoinRoom(roomId, adminId);
  }

  // Đóng phòng hỗ trợ
  async closeSupportRoom(conversationId: string, closedBy: string) {
    return await this.roomService.closeSupportRoom(conversationId, closedBy);
  }

  // ================== Reaction methods ==================
  // Thêm reaction vào tin nhắn
  async addReaction(messageId: string, userId: string, reaction: string) {
    return await this.reactionService.addReaction(messageId, userId, reaction);
  }

  // Xóa reaction khỏi tin nhắn
  async removeReaction(messageId: string, userId: string, reaction: string) {
    return await this.reactionService.removeReaction(messageId, userId, reaction);
  }

  // (Stub) Lấy thông báo
  async getNotifications() {}

  // ================== Redis/Online methods ==================
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

  // ================== User info methods ==================
  // Lấy thông tin user theo id
  async getUser(userId: string) {
    return await this.usersService.findById(userId);
  }

  // Lấy tất cả user
  async getUsers() {
    return await this.usersService.findAll();
  }

  // Kiểm tra user có phải thành viên phòng không
  async validateRoomMembership(userId: string, roomId: string): Promise<boolean> {
    try {
      const room = await this.roomService.getRoom(roomId, userId);
      return !!room;
    } catch {
      return false;
    }
  }

  // Gán admin cho user cần hỗ trợ
  async assignAdminToUser(userId: string) {
    return await this.roomService.assignAdminToUser(userId);
  }

  // Gán các phòng chờ cho admin
  async assignPendingRoomsToAdmins() {
    return await this.roomService.assignPendingRoomsToAdmins();
  }

  // Lấy danh sách admin đang active theo user
  async getActiveAdminIdsByUserId(userId: string) {
    return await this.roomService.getActiveAdminIdsByUserId(userId);
  }

  // Lấy danh sách cặp admin-room đang active theo user
  public getActiveAdminRoomPairsByUserId(userId: string) {
    return this.roomService.getActiveAdminRoomPairsByUserId(userId);
  }
}
