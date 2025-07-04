import { SubscribeMessage, WebSocketGateway, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private logger = new Logger('ChatGateway');

  afterInit(server: Server): void {
    this.logger.log('WebSocket Initialized');
  }

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // 1. Gửi/nhận tin nhắn mới
  @SubscribeMessage('message:new')
  handleNewMessage(@MessageBody() data: any, @ConnectedSocket() client: Socket): void {
    client.broadcast.emit('message:new', data);
  }

  // 2. Thông báo tin nhắn bị thu hồi hoặc xóa
  @SubscribeMessage('message:deleted')
  handleDeleteMessage(@MessageBody() data: any, @ConnectedSocket() client: Socket): void {
    client.broadcast.emit('message:deleted', data);
  }

  // 3. Cập nhật emoji/cảm xúc của tin nhắn
  @SubscribeMessage('reaction:updated')
  handleReactionUpdated(@MessageBody() data: any, @ConnectedSocket() client: Socket): void {
    client.broadcast.emit('reaction:updated', data);
  }

  // 4. Phòng chat được chỉnh sửa (tên, mô tả, avatar)
  @SubscribeMessage('room:updated')
  handleRoomUpdated(@MessageBody() data: any, @ConnectedSocket() client: Socket): void {
    client.broadcast.emit('room:updated', data);
  }

  // 5. Thành viên mới tham gia phòng
  @SubscribeMessage('room:joined')
  handleRoomJoined(@MessageBody() data: any, @ConnectedSocket() client: Socket): void {
    client.broadcast.emit('room:joined', data);
  }

  // 6. Thành viên rời khỏi phòng
  @SubscribeMessage('room:left')
  handleRoomLeft(@MessageBody() data: any, @ConnectedSocket() client: Socket): void {
    client.broadcast.emit('room:left', data);
  }

  // 7. Thông báo mới từ hệ thống (tin nhắn, mention,...)
  @SubscribeMessage('notification:new')
  handleNotificationNew(@MessageBody() data: any, @ConnectedSocket() client: Socket): void {
    client.broadcast.emit('notification:new', data);
  }

  // 8. Tin nhắn đã được người khác đọc
  @SubscribeMessage('message:read')
  handleMessageRead(@MessageBody() data: any, @ConnectedSocket() client: Socket): void {
    client.broadcast.emit('message:read', data);
  }
}
