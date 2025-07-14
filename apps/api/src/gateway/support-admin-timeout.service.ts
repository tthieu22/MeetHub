import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { RoomService } from '@api/modules/chat/chat-room/room.service';
import { ChatGateway } from './chat.gateway';

@Injectable()
export class SupportAdminTimeoutService {
  constructor(
    private readonly roomService: RoomService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @Interval(60000)
  async emitAdminTimeouts() {
    const changedRooms = await this.roomService.checkAdminTimeouts();
    for (const { roomId, userId, newAdminId } of changedRooms) {
      this.chatGateway.server.to(`room:${roomId}`).emit('support_admin_changed', {
        roomId,
        userId,
        newAdminId,
      });
      // Có thể emit thêm cho user hoặc admin mới nếu muốn
    }
  }
}
