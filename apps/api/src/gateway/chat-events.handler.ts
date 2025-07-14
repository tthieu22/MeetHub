import { Injectable } from '@nestjs/common';
import { ChatService } from './chat.service';
import { GetMessagesDto } from '@api/modules/chat/chat-message/dto/get-messages.dto';
import { MarkRoomReadDto } from '@api/modules/chat/chat-message/dto/mark-room-read.dto';
import { GetUnreadCountDto } from '@api/modules/chat/chat-message/dto/get-unread-count.dto';
import { CreateMessageDto } from '@api/modules/chat/chat-message/dto/create-message.dto';
import { WsResponse } from '@api/common/interfaces/ws-response.interface';

@Injectable()
export class ChatEventsHandler {
  constructor(private readonly chatService: ChatService) {}

  async handleGetRooms(userId: string): Promise<WsResponse> {
    const rooms: any[] = await this.chatService.getRoomSidebarInfo(userId);
    return { success: true, data: rooms };
  }

  async handleGetMessages(userId: string, dto: GetMessagesDto): Promise<WsResponse> {
    const isMember = await this.chatService.validateRoomMembership(userId, dto.roomId);
    if (!isMember) {
      return { success: false, message: 'Bạn không phải member của room này', code: 'NOT_MEMBER' };
    }
    const before = dto.before ? new Date(dto.before) : undefined;
    const messages = await this.chatService.getMessages(dto.roomId, 1, dto.limit || 20, before);
    return { success: true, data: { roomId: dto.roomId, ...messages } };
  }

  async handleMarkRoomRead(userId: string, dto: MarkRoomReadDto): Promise<WsResponse> {
    const isMember = await this.chatService.validateRoomMembership(userId, dto.roomId);
    if (!isMember) {
      return { success: false, message: 'Bạn không phải member của room này', code: 'NOT_MEMBER' };
    }
    await this.chatService.markAllAsRead(dto.roomId, userId);
    return { success: true, message: 'Đã đánh dấu đọc thành công', data: { roomId: dto.roomId, userId, markedAt: new Date() } };
  }

  async handleGetUnreadCount(userId: string, dto: GetUnreadCountDto): Promise<WsResponse> {
    const isMember = await this.chatService.validateRoomMembership(userId, dto.roomId);
    if (!isMember) {
      return { success: false, message: 'Bạn không phải member của room này', code: 'NOT_MEMBER' };
    }
    const unreadCount = await this.chatService.getUnreadCount(dto.roomId, userId);
    return { success: true, data: { roomId: dto.roomId, unreadCount } };
  }

  async handleCreateMessage(userId: string, dto: CreateMessageDto & { roomId: string }): Promise<WsResponse> {
    const isMember = await this.chatService.validateRoomMembership(userId, dto.roomId);
    if (!isMember) {
      return { success: false, message: 'Bạn không phải member của room này', code: 'NOT_MEMBER' };
    }
    const message = await this.chatService.createMessage(dto, dto.roomId, userId);
    return { success: true, data: message };
  }

  async handleJoinRoom(userId: string, roomId: string): Promise<WsResponse> {
    const isMember = await this.chatService.validateRoomMembership(userId, roomId);
    if (!isMember) {
      return { success: false, message: 'Bạn không phải member của room này', code: 'NOT_MEMBER' };
    }
    return { success: true, message: `Đã join vào room ${roomId}` };
  }

  async handleGetAllOnlineUsers(): Promise<WsResponse> {
    try {
      const redisClient = this.chatService['redisClient'];
      const keys = await redisClient.keys('user:online:*');

      const onlineChecks = await Promise.all(
        keys.map(async (key) => {
          const userId = key.replace('user:online:', '');
          const status = await redisClient.get(key);
          return { userId, status };
        }),
      );

      const onlineUserIds = onlineChecks.filter(({ status }) => status === '1').map(({ userId }) => userId);

      const onlineUsers = await Promise.all(
        onlineUserIds.map(async (userId) => {
          const user = await this.chatService.getUser(userId);
          if (!user) return null;

          return {
            userId: user._id,
            name: user.name,
            email: user.email,
            avatarURL: user.avatarURL,
            isOnline: true,
          };
        }),
      );

      // Lọc bỏ null values
      const validOnlineUsers = onlineUsers.filter((user) => user !== null);
      return { success: true, data: validOnlineUsers };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, message: errorMessage, code: 'GET_ONLINE_USERS_ERROR' };
    }
  }
}
