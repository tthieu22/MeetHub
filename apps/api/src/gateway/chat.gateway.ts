import { SubscribeMessage, WebSocketGateway, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ChatService, ChatMessageData } from './chat.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/',
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private logger = new Logger('ChatGateway');

  constructor(private chatService: ChatService) {}

  afterInit(): void {
    this.logger.log('WebSocket Initialized');
  }

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);

    // Lắng nghe sự kiện user:online từ client với token
    client.on('user:online:token', (data: { token: string }) => {
      this.logger.log(`User online with token event received from client ${client.id}`);
      const result = this.chatService.handleUserOnlineWithToken(data.token, client.id);

      if (result.success) {
        // Broadcast online users ngay khi có user mới online
        this.chatService.broadcastOnlineUsers(client);
      }
    });

    // Lắng nghe sự kiện user:online từ client với userId trực tiếp (backward compatibility)
    client.on('user:online', (userId: string) => {
      this.logger.log(`User online event received: ${userId} from client ${client.id}`);
      this.chatService.handleUserOnline(userId, client.id);
      // Broadcast online users ngay khi có user mới online
      this.chatService.broadcastOnlineUsers(client);
    });

    // Debug: Log tất cả clients đang connect
    this.logger.log(`Total clients connected: ${this.chatService.getClientCount()}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
    const result = this.chatService.handleUserOffline(client.id);
    if (result.success) {
      this.chatService.broadcastOnlineUsers(client);
    }
  }

  // 1. Gửi/nhận tin nhắn mới
  @SubscribeMessage('chat:message:new')
  async handleNewMessage(@MessageBody() data: ChatMessageData, @ConnectedSocket() client: Socket): Promise<void> {
    this.logger.log(`Received new message from client ${client.id}:`, JSON.stringify(data));

    try {
      // Xử lý tin nhắn mới thông qua ChatService
      const savedMessage = await this.chatService.handleNewMessage(data);

      // Broadcast tin nhắn đến tất cả clients khác
      this.chatService.broadcastMessage(client, savedMessage);

      // Gửi confirmation cho client gửi
      this.chatService.sendMessageConfirmation(client, savedMessage);

      this.logger.log(`Message processed successfully`);
    } catch (error) {
      this.logger.error(`Failed to process message: ${error.message}`);
      this.chatService.sendErrorMessage(client, 'Failed to save message', data);
    }
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
