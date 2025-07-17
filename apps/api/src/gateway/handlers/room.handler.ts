import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { WsResponse } from '@api/common/interfaces/ws-response.interface';
import { ChatService } from '../chat.service';
import { AuthenticatedSocket } from '@api/common/guards/ws-auth.guard';
import { emitError } from '../utils/error.util';
import { WS_RESPONSE_EVENTS } from '../websocket.events';

@Injectable()
export class RoomHandler {
  constructor(private readonly chatService: ChatService) {}

  // Lấy danh sách các phòng của user (sidebar)
  async handleGetRooms(userId: string): Promise<WsResponse> {
    const rooms: any[] = await this.chatService.getRoomSidebarInfo(userId);
    return { success: true, data: rooms };
  }

  // Xử lý user join vào phòng, kiểm tra quyền, join socket room, gửi sự kiện
  async handleJoinRoom(client: AuthenticatedSocket, server: Server, userId: string, roomId: string): Promise<void> {
    const isMember = await this.chatService.validateRoomMembership(userId, roomId);
    if (!isMember) {
      client.emit('room_joined', { success: false, message: 'Bạn không phải member của room này', code: 'NOT_MEMBER' });
      return;
    }

    await client.join(`room:${roomId}`);
    await client.join(`user:${userId}`);
    await this.emitRoomOnlineMembers(server, roomId);
    client.emit(WS_RESPONSE_EVENTS.ROOM_JOINED, { success: true, message: `Đã join vào room ${roomId}` });
  }

  // Lấy danh sách thành viên online trong phòng và gửi về client
  async handleGetRoomOnlineMembers(client: AuthenticatedSocket, server: Server, roomId: string): Promise<void> {
    try {
      const onlineMemberIds = await this.chatService.getOnlineMemberIds(roomId);
      const response: WsResponse = {
        success: true,
        data: { roomId, onlineMemberIds },
      };
      client.emit(WS_RESPONSE_EVENTS.ROOM_ONLINE_MEMBERS, response);
    } catch (err) {
      emitError(client, 'GET_ONLINE_MEMBERS_ERROR', (err as Error).message, 'room_online_members');
    }
  }

  // Gửi sự kiện cập nhật thành viên online cho cả phòng
  async emitRoomOnlineMembers(server: Server, roomId: string): Promise<void> {
    const onlineMemberIds = await this.chatService.getOnlineMemberIds(roomId);
    const response: WsResponse = {
      success: true,
      data: { roomId, onlineMemberIds },
    };
    server.to(`room:${roomId}`).emit(WS_RESPONSE_EVENTS.ROOM_ONLINE_MEMBERS, response);
  }
}
