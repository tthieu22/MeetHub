import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { ChatService } from '../chat.service';
import { AuthenticatedSocket } from '@api/common/guards/ws-auth.guard';
import { emitError } from '../utils/error.util';
import { WS_RESPONSE_EVENTS } from '../websocket.events';

@Injectable()
export class SupportHandler {
  constructor(private readonly chatService: ChatService) {}

  // Xử lý khi user yêu cầu hỗ trợ, gán admin và tạo/join phòng support
  async handleUserRequestSupport(client: AuthenticatedSocket, server: Server, userId: string): Promise<void> {
    try {
      const { roomId, admin, pending } = await this.chatService.assignAdminToUser(userId);
      await client.join(`room:${String(roomId)}`);
      if (pending) {
        client.emit(WS_RESPONSE_EVENTS.SUPPORT_ROOM_PENDING, { roomId: String(roomId) });
        return;
      }
      if (admin && admin._id) {
        server.to(`user:${String(admin._id)}`).emit(WS_RESPONSE_EVENTS.SUPPORT_TICKET_ASSIGNED, { roomId: String(roomId), userId: String(userId) });
        server.to(`user:${String(admin._id)}`).emit(WS_RESPONSE_EVENTS.SUPPORT_ROOM_ASSIGNED, { roomId: String(roomId), admin });
      }
      client.emit(WS_RESPONSE_EVENTS.SUPPORT_ROOM_ASSIGNED, { roomId: String(roomId), admin });
    } catch (err) {
      emitError(client, 'ASSIGN_ADMIN_ERROR', err instanceof Error ? err.message : String(err), 'support_room_assigned');
      const adminRoomPairs = await this.chatService.getActiveAdminRoomPairsByUserId(userId);
      for (const { adminId, adminName, roomId, userId: uId, userName } of adminRoomPairs) {
        server.to(`user:${adminId}`).emit(WS_RESPONSE_EVENTS.SUPPORT_TICKET_ASSIGNED, {
          roomId,
          adminId,
          adminName,
          userId: uId,
          userName,
          message: err instanceof Error ? err.message : String(err),
          code: 'ASSIGN_ADMIN_ERROR',
        });
      }
    }
  }

  // Xử lý khi admin tham gia phòng hỗ trợ, thông báo cho user và admin
  async handleAdminJoinSupportRoom(client: AuthenticatedSocket, server: Server, adminId: string, roomId: string): Promise<void> {
    const room = await this.chatService.adminJoinRoom(roomId, adminId);
    if (!room) {
      client.emit(WS_RESPONSE_EVENTS.ERROR, { message: 'Không tìm thấy phòng' });
      return;
    }
    await client.join(`room:${roomId}`);
    const userIdObj = room.memberIds.find((id) => id.toString() !== adminId.toString());
    const userId = userIdObj?.toString();
    if (userId) {
      server.to(`user:${userId}`).emit(WS_RESPONSE_EVENTS.SUPPORT_ADMIN_JOINED, {
        roomId: roomId,
        admin: { _id: adminId, name: client.user.name },
      });
    }
    client.emit(WS_RESPONSE_EVENTS.SUPPORT_TICKET_ASSIGNED, {
      roomId: roomId,
      userId,
    });
  }

  // Xử lý đóng phòng hỗ trợ, xác nhận quyền và thông báo các thành viên
  async handleCloseSupportRoom(client: AuthenticatedSocket, server: Server, userId: string, roomId: string): Promise<void> {
    const isMember = await this.chatService.validateRoomMembership(userId, roomId);
    if (!isMember) {
      client.emit(WS_RESPONSE_EVENTS.SUPPORT_ROOM_CLOSED, { success: false, message: 'Bạn không phải thành viên phòng này' });
      return;
    }
    await this.chatService.closeSupportRoom(roomId, userId);
    server.to(`room:${roomId}`).emit(WS_RESPONSE_EVENTS.SUPPORT_ROOM_CLOSED, { roomId: roomId, closedBy: userId });
  }

  // Emit sự kiện đổi admin do timeout cho các thành viên phòng support
  emitAdminTimeouts(server: Server, changedRooms: { roomId: string; userId: string; newAdminId: string }[]): void {
    for (const { roomId, userId, newAdminId } of changedRooms) {
      server.to(`room:${roomId}`).emit(WS_RESPONSE_EVENTS.SUPPORT_ADMIN_CHANGED, {
        roomId,
        userId,
        newAdminId,
      });
    }
  }
}
