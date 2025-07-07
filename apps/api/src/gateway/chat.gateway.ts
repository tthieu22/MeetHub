import { SubscribeMessage, WebSocketGateway, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private logger = new Logger('ChatGateway');

  afterInit(): void {
    this.logger.log('WebSocket Initialized');
  }

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // 1. Gửi/nhận tin nhắn mới
  @SubscribeMessage('chat:message:new')
  handleNewMessage(@MessageBody() data: any, @ConnectedSocket() client: Socket): void {
    client.broadcast.emit('chat:message:new', data);
  }

  // 2. Thông báo tin nhắn bị thu hồi hoặc xóa
  @SubscribeMessage('chat:message:deleted')
  handleDeleteMessage(@MessageBody() data: any, @ConnectedSocket() client: Socket): void {
    client.broadcast.emit('chat:message:deleted', data);
  }

  // 3. Cập nhật emoji/cảm xúc của tin nhắn
  @SubscribeMessage('chat:reaction:updated')
  handleReactionUpdated(@MessageBody() data: any, @ConnectedSocket() client: Socket): void {
    client.broadcast.emit('chat:reaction:updated', data);
  }

  // 4. Phòng chat được chỉnh sửa (tên, mô tả, avatar)
  @SubscribeMessage('chat:room:updated')
  handleRoomUpdated(@MessageBody() data: any, @ConnectedSocket() client: Socket): void {
    client.broadcast.emit('chat:room:updated', data);
  }

  // 5. Thành viên mới tham gia phòng
  @SubscribeMessage('chat:room:joined')
  handleRoomJoined(@MessageBody() data: any, @ConnectedSocket() client: Socket): void {
    client.broadcast.emit('chat:room:joined', data);
  }

  // 6. Thành viên rời khỏi phòng
  @SubscribeMessage('chat:room:left')
  handleRoomLeft(@MessageBody() data: any, @ConnectedSocket() client: Socket): void {
    client.broadcast.emit('chat:room:left', data);
  }

  // 7. Thông báo mới từ hệ thống (tin nhắn, mention,...)
  @SubscribeMessage('chat:notification:new')
  handleNotificationNew(@MessageBody() data: any, @ConnectedSocket() client: Socket): void {
    client.broadcast.emit('chat:notification:new', data);
  }

  // 8. Tin nhắn đã được người khác đọc
  @SubscribeMessage('chat:message:read')
  handleMessageRead(@MessageBody() data: any, @ConnectedSocket() client: Socket): void {
    client.broadcast.emit('chat:message:read', data);
  }
}
