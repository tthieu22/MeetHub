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

  @Interval(60000)
  async emitAdminTimeouts() {
    const changedRooms = await this.roomService.checkAdminTimeouts();
    this.supportHandler.emitAdminTimeouts(this.chatGateway.server, changedRooms);
  }
}
