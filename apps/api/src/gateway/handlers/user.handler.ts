import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { WsResponse } from '@api/common/interfaces/ws-response.interface';
import { ChatService } from '../chat.service';
import { AuthenticatedSocket } from '@api/common/guards/ws-auth.guard';
import { RoomHandler } from './room.handler';
import { WS_RESPONSE_EVENTS } from '../websocket.events';

@Injectable()
export class UserHandler {
  constructor(
    private readonly chatService: ChatService,
    private readonly roomHandler: RoomHandler,
  ) {}

  // Lấy danh sách tất cả user đang online
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

      const validOnlineUsers = onlineUsers.filter((user) => user !== null);
      return { success: true, data: validOnlineUsers };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, message: errorMessage, code: 'GET_ONLINE_USERS_ERROR' };
    }
  }

  // Xử lý khi user offline: xóa trạng thái online, emit offline tới các phòng, cập nhật danh sách online
  async handleUserOffline(client: AuthenticatedSocket, server: Server, userId: string): Promise<void> {
    if (this.chatService['redisClient']) {
      await this.chatService['redisClient'].del(`user:online:${userId}`);
    }

    const rooms: { roomId: string }[] = await this.chatService.getRooms(userId);
    const roomIds = rooms.map((r) => r.roomId);

    await Promise.all(
      roomIds.map(async (roomId) => {
        const response: WsResponse = {
          success: true,
          data: { userId, roomId },
        };
        server.to(`room:${roomId}`).emit(WS_RESPONSE_EVENTS.USER_OFFLINE, response);
        await this.roomHandler.emitRoomOnlineMembers(server, roomId);
      }),
    );

    const allOnlineResponse = await this.handleGetAllOnlineUsers();
    server.emit(WS_RESPONSE_EVENTS.ALL_ONLINE_USERS, allOnlineResponse);
  }

  // Emit sự kiện user online tới các phòng và cập nhật danh sách online toàn hệ thống
  async emitUserOnline(server: Server, userId: string, roomIds: string[]): Promise<void> {
    for (const roomId of roomIds) {
      const response: WsResponse = {
        success: true,
        data: { userId, roomId },
      };
      server.to(`room:${roomId}`).emit(WS_RESPONSE_EVENTS.USER_ONLINE, response);
      await this.roomHandler.emitRoomOnlineMembers(server, roomId);
    }

    const allOnlineResponse = await this.handleGetAllOnlineUsers();
    server.emit(WS_RESPONSE_EVENTS.ALL_ONLINE_USERS, allOnlineResponse);
  }
}
