import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { AuthenticatedSocket } from '@api/common/guards/ws-auth.guard';
import { WsAuthService } from '@api/common/services/ws-auth.service';
import { ChatService } from '../chat.service';
import { WsResponse } from '@api/common/interfaces/ws-response.interface';
import { UserHandler } from './user.handler';
import { WS_RESPONSE_EVENTS } from '../websocket.events';

@Injectable()
export class ConnectionHandler {
  constructor(
    private wsAuthService: WsAuthService,
    private chatService: ChatService,
    private userHandler: UserHandler,
  ) {}

  // Xử lý kết nối mới: xác thực, join các phòng, đánh dấu online, gửi sự kiện thành công
  async handleConnection(client: AuthenticatedSocket, server: Server): Promise<void> {
    try {
      const payload = await this.wsAuthService.validateToken(client);
      client.user = payload;
    } catch (err) {
      const response: WsResponse = {
        success: false,
        message: (err as Error).message,
        code: 'TOKEN_INVALID',
      };
      client.emit(WS_RESPONSE_EVENTS.AUTH_ERROR, response);
      client.disconnect();
      return;
    }

    const { user } = client;
    if (!user?._id) {
      const response: WsResponse = {
        success: false,
        message: 'User không xác thực',
        code: 'USER_INVALID',
      };
      client.emit(WS_RESPONSE_EVENTS.AUTH_ERROR, response);
      client.disconnect();
      return;
    }

    const userId = user._id;
    const rooms = await this.chatService.getRooms(userId);
    const roomIds = rooms.map((r) => r.roomId);

    await Promise.all(roomIds.map((roomId) => client.join(`room:${roomId}`)));

    const onlineResult = await this.chatService.setUserOnline(userId);
    if (!onlineResult.success) {
      const response: WsResponse = {
        success: false,
        message: 'Không thể đánh dấu online',
        code: 'REDIS_ERROR',
      };
      client.emit(WS_RESPONSE_EVENTS.ERROR, response);
      return;
    }

    await this.userHandler.emitUserOnline(server, userId, roomIds);

    const response: WsResponse = {
      success: true,
      data: { userId, rooms: roomIds },
    };
    client.emit(WS_RESPONSE_EVENTS.CONNECTION_SUCCESS, response);

    await client.join(`user:${user._id}`);

    if (user.role === 'admin') {
      const assignedRooms = await this.chatService.assignPendingRoomsToAdmins();
      const assignedRoom = assignedRooms?.[0];
      if (assignedRoom) {
        server.to(`user:${assignedRoom.userId}`).emit(WS_RESPONSE_EVENTS.SUPPORT_ROOM_ASSIGNED, {
          roomId: String(assignedRoom.roomId),
          admin: {
            _id: user._id,
            name: user.name,
          },
        });
        server.to(`user:${user._id}`).emit(WS_RESPONSE_EVENTS.SUPPORT_TICKET_ASSIGNED, {
          roomId: String(assignedRoom.roomId),
          userId: String(assignedRoom.userId),
        });
      }
    }
  }

  // Xử lý khi client disconnect: xóa trạng thái online khỏi redis (nếu có)
  async handleDisconnect(client: AuthenticatedSocket): Promise<void> {
    const userId = client.user?._id as string | undefined;
    if (!userId) return;

    if (this.chatService['redisClient']) {
      await this.chatService['redisClient'].del(`user:online:${userId}`);
    }
    // Note: The 'user_offline' event should be emitted by the client before disconnecting
    // for better reliability. Handling it here is a fallback.
  }
}
