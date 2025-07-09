import { WebSocketGateway, OnGatewayConnection, OnGatewayDisconnect, WebSocketServer, SubscribeMessage, ConnectedSocket } from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { ChatService } from '@api/gateway/chat.service';
import { WsAuthGuard, AuthenticatedSocket } from '@api/common/guards/ws-auth.guard';
import { Server } from 'socket.io';
import { RoomSidebarInfo } from '@api/modules/chat/chat-room/interfaces/room-sidebar.interface';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/',
  transports: ['websocket'],
})
@UseGuards(WsAuthGuard)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  constructor(private chatService: ChatService) {}

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    const { user } = client;
    if (!user?.sub) {
      client.emit('auth_error', { success: false, message: 'User không xác thực', code: 'USER_INVALID' });
      client.disconnect();
      return;
    }
    const userId = user.sub;
    const rooms = await this.chatService.getRooms(userId);
    const roomIds = rooms.map((r) => r.roomId);
    await Promise.all(roomIds.map((roomId) => client.join(`room:${roomId}`)));
    const onlineResult = await this.chatService.setUserOnline(userId);
    if (!onlineResult.success) {
      client.emit('error', { success: false, message: 'Không thể đánh dấu online', code: 'REDIS_ERROR' });
      return;
    }
    this.emitUserOnline(userId, roomIds);
    client.emit('connection_success', { success: true, userId, rooms: roomIds });
  }

  handleDisconnect(): void {}

  emitUserOnline(userId: string, roomIds: string[]): void {
    roomIds.forEach((roomId) => {
      this.server.to(`room:${roomId}`).emit('user_online', { userId, roomId });
    });
  }

  @SubscribeMessage('get_rooms')
  async handleGetRooms(@ConnectedSocket() client: AuthenticatedSocket) {
    const user = client.user;
    if (!user?.sub) {
      client.emit('error', { success: false, message: 'User không xác thực', code: 'USER_INVALID' });
      return;
    }
    const userId = user.sub;
    const rooms: RoomSidebarInfo[] = await this.chatService.getRoomSidebarInfo(userId);
    client.emit('rooms', rooms);
  }
}
