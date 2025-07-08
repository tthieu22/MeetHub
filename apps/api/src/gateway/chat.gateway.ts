import { SubscribeMessage, WebSocketGateway, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ChatService } from '@api/gateway/chat.service';
import { ChatMessageData } from '@api/gateway/chat-gateway.types';

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

      // Emit event cập nhật phòng chỉ cho đúng room
      const io = client.nsp;
      await this.chatService.emitRoomUpdated(io, data.roomId, data.senderId);

      this.logger.log(`Message processed successfully`);
    } catch (error) {
      this.logger.error(`Failed to process message: ${error instanceof Error ? error.message : 'Unknown error'}`);
      this.chatService.sendErrorMessage(client, 'Failed to save message', data);
    }
  }

  // 2. Thông báo tin nhắn bị thu hồi hoặc xóa
  @SubscribeMessage('chat:message:deleted')
  async handleDeleteMessage(@MessageBody() data: { messageId: string; userId: string }, @ConnectedSocket() client: Socket) {
    const result = await this.chatService.deleteMessage(data.messageId, data.userId);
    client.broadcast.emit('chat:message:deleted', result);
    client.emit('chat:message:deleted', result);
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

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(@MessageBody() data: { roomId: string }, @ConnectedSocket() client: Socket) {
    await client.join(data.roomId);
    client.emit('joinedRoom', { roomId: data.roomId });
    // Emit lịch sử tin nhắn
    const messages = await this.chatService.getMessagesHistory(data.roomId);
    client.emit('chat:messages:history', { roomId: data.roomId, messages });
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(@MessageBody() data: { roomId: string }, @ConnectedSocket() client: Socket) {
    await client.leave(data.roomId);
  }

  // // --- Notification handlers ---
  // @SubscribeMessage('chat:notification:create')
  // async handleCreateNotification(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
  //   const notification = await this.chatService.createNotification(data);
  //   client.emit('chat:notification:new', notification);
  // }

  // @SubscribeMessage('chat:notification:get')
  // async handleGetNotifications(@MessageBody() data: { userId: string }, @ConnectedSocket() client: Socket) {
  //   const notifications: unknown = await this.chatService.getNotifications(data.userId);
  //   client.emit('chat:notification:list', Array.isArray(notifications) ? notifications : []);
  // }

  // --- Reaction handlers ---
  @SubscribeMessage('chat:reaction:add')
  async handleAddReaction(@MessageBody() data: { messageId: string; userId: string; emoji: string }, @ConnectedSocket() client: Socket) {
    const reaction: unknown = await this.chatService.addReaction(data.messageId, data.userId, data.emoji);
    client.broadcast.emit('chat:reaction:updated', reaction);
    client.emit('chat:reaction:updated', reaction);
  }

  @SubscribeMessage('chat:reaction:remove')
  async handleRemoveReaction(@MessageBody() data: { messageId: string; userId: string; emoji: string }, @ConnectedSocket() client: Socket) {
    const result: unknown = await this.chatService.removeReaction(data.messageId, data.userId, data.emoji);
    client.emit('chat:reaction:removed', result);
  }

  // --- Room handlers ---
  @SubscribeMessage('chat:room:addMember')
  async handleAddMember(@MessageBody() data: { roomId: string; userId: string }, @ConnectedSocket() client: Socket) {
    const result = await this.chatService.addMember(data.roomId, data.userId, client.id);
    client.broadcast.emit('chat:room:updated', result);
    client.emit('chat:room:updated', result);
  }

  @SubscribeMessage('chat:room:removeMember')
  async handleRemoveMember(@MessageBody() data: { roomId: string; userId: string }, @ConnectedSocket() client: Socket) {
    const result = await this.chatService.removeMember(data.roomId, data.userId);
    client.emit('chat:room:memberRemoved', result);
  }

  @SubscribeMessage('chat:room:get')
  async handleGetRoom(@MessageBody() data: { roomId: string; userId: string }, @ConnectedSocket() client: Socket) {
    const room = await this.chatService.getRoom(data.roomId, data.userId);
    client.emit('chat:room:info', room);
  }

  // --- User handlers ---
  // @SubscribeMessage('chat:user:block')
  // async handleBlockUser(@MessageBody() data: { userId: string; targetUserId: string }, @ConnectedSocket() client: Socket) {
  //   const result = await this.chatService.blockUser(data.userId, data.targetUserId);
  //   client.emit('chat:user:blocked', result);
  // }

  // @SubscribeMessage('chat:user:unblock')
  // async handleUnblockUser(@MessageBody() data: { userId: string; targetUserId: string }, @ConnectedSocket() client: Socket) {
  //   const result = await this.chatService.unblockUser(data.userId, data.targetUserId);
  //   client.emit('chat:user:unblocked', result);
  // }

  // @SubscribeMessage('chat:user:getBlocked')
  // async handleGetBlockedUsers(@MessageBody() data: { userId: string }, @ConnectedSocket() client: Socket) {
  //   const blocked: unknown = await this.chatService.getBlockedUsers(data.userId);
  //   client.emit('chat:user:blockedList', Array.isArray(blocked) ? blocked : []);
  // }

  // --- Message handlers ---
  @SubscribeMessage('chat:message:create')
  async handleCreateMessage(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    const message = await this.chatService.createMessage(data);
    const msgObjRaw = typeof message.toObject === 'function' ? message.toObject() : message;
    const msgObj: any = msgObjRaw;
    if (!msgObj.createdAt) msgObj.createdAt = new Date();
    const formatted = this.chatService['formatMessageForClient'](msgObj);
    this.chatService.broadcastMessage(client, formatted);
    this.chatService.sendMessageConfirmation(client, formatted);
  }

  @SubscribeMessage('chat:message:pin')
  async handlePinMessage(@MessageBody() data: { messageId: string; userId: string }, @ConnectedSocket() client: Socket) {
    const result = await this.chatService.togglePinMessage(data.messageId, data.userId);
    client.emit('chat:message:pinned', result);
  }

  @SubscribeMessage('chat:message:readService')
  async handleReadMessageService(@MessageBody() data: { messageId: string; userId: string }, @ConnectedSocket() client: Socket) {
    const result = await this.chatService.markAsRead(data.messageId, data.userId);
    client.emit('chat:message:read', result);
  }

  @SubscribeMessage('chat:message:getMentions')
  async handleGetMentions(@MessageBody() data: { messageId: string }, @ConnectedSocket() client: Socket) {
    const mentions = await this.chatService.getMessageMentions(data.messageId);
    client.emit('chat:message:mentions', mentions);
  }

  @SubscribeMessage('chat:message:uploadFile')
  async handleUploadFile(@MessageBody() data: { messageId: string; file: any; userId: string }, @ConnectedSocket() client: Socket) {
    const result = await this.chatService.uploadFile(data.messageId, data.file, data.userId);
    client.emit('chat:message:fileUploaded', result);
  }

  @SubscribeMessage('chat:message:getFiles')
  async handleGetFiles(@MessageBody() data: { messageId: string }, @ConnectedSocket() client: Socket) {
    const files = await this.chatService.getMessageFiles(data.messageId);
    client.emit('chat:message:files', files);
  }
}
