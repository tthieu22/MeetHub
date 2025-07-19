import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { RoomService } from '@api/modules/chat/chat-room/room.service';
import { ChatGateway } from './chat.gateway';
import { SupportHandler } from './handlers/support.handler';

@Injectable()
export class SupportAdminTimeoutService {
  constructor(
    private readonly roomService: RoomService,
    private readonly chatGateway: ChatGateway,
    private readonly supportHandler: SupportHandler,
  ) {}

  @Interval(60000) // Chạy mỗi phút
  async emitAdminTimeouts() {
    const changedRooms = await this.roomService.checkAdminTimeouts();
    this.supportHandler.emitAdminTimeouts(this.chatGateway.server, changedRooms);
  }

  @Interval(30000) // Chạy mỗi 30 giây
  async assignPendingRoomsToOnlineAdmins() {
    const assignedRooms = await this.roomService.assignPendingRoomsToAdmins();

    // Emit events cho các phòng đã được gán admin
    for (const { roomId, admin, userId } of assignedRooms) {
      const adminObj = admin as { _id: string; name?: string; email?: string };
      const adminName = adminObj.name || adminObj.email || 'Admin';

      // Thông báo cho admin
      this.chatGateway.server.to(`user:${adminObj._id}`).emit('support_ticket_assigned', {
        roomId,
        userId,
        userName: adminName,
        message: 'Bạn đã được gán phòng hỗ trợ mới',
      });

      // Thông báo cho user
      this.chatGateway.server.to(`user:${userId}`).emit('support_room_assigned', {
        roomId,
        admin: { _id: adminObj._id, name: adminName },
      });

      // Thông báo cho cả phòng
      this.chatGateway.server.to(`room:${roomId}`).emit('support_admin_joined', {
        roomId,
        admin: { _id: adminObj._id, name: adminName },
      });
    }
  }
}
