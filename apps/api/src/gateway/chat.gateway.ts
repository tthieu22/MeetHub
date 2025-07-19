import { WebSocketGateway, OnGatewayConnection, OnGatewayDisconnect, WebSocketServer, SubscribeMessage, ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { WsAuthGuard, AuthenticatedSocket } from '@api/common/guards/ws-auth.guard';
import { Server } from 'socket.io';
import { GetMessagesDto } from '@api/modules/chat/chat-message/dto/get-messages.dto';
import { MarkRoomReadDto } from '@api/modules/chat/chat-message/dto/mark-room-read.dto';
import { GetUnreadCountDto } from '@api/modules/chat/chat-message/dto/get-unread-count.dto';
import { CreateMessageDto } from '@api/modules/chat/chat-message/dto/create-message.dto';
import { ConnectionHandler } from './handlers/connection.handler';
import { RoomHandler } from './handlers/room.handler';
import { MessageHandler } from './handlers/message.handler';
import { UserHandler } from './handlers/user.handler';
import { SupportHandler } from './handlers/support.handler';
import { validateClient } from './utils/error.util';
import { WS_RESPONSE_EVENTS } from './websocket.events';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/',
  transports: ['websocket'],
})
@UseGuards(WsAuthGuard)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(
    private readonly connectionHandler: ConnectionHandler,
    private readonly roomHandler: RoomHandler,
    private readonly messageHandler: MessageHandler,
    private readonly userHandler: UserHandler,
    private readonly supportHandler: SupportHandler,
  ) {}

  // ====== KẾT NỐI / NGẮT KẾT NỐI ======
  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    await this.connectionHandler.handleConnection(client, this.server);
  }

  async handleDisconnect(client: AuthenticatedSocket): Promise<void> {
    await this.connectionHandler.handleDisconnect(client);
  }

  // ====== PHÒNG CHAT ======
  @SubscribeMessage('get_rooms')
  async handleGetRooms(@ConnectedSocket() client: AuthenticatedSocket) {
    const userId = validateClient(client);
    if (!userId) return;
    const response = await this.roomHandler.handleGetRooms(userId);
    client.emit('rooms', response);
  }

  @SubscribeMessage('join_room')
  @UsePipes(new ValidationPipe({ transform: true }))
  async handleJoinRoom(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: { roomId: string }) {
    const userId = validateClient(client);
    if (!userId) return;
    await this.roomHandler.handleJoinRoom(client, this.server, userId, data.roomId);
  }

  @SubscribeMessage('get_room_online_members')
  async handleGetRoomOnlineMembers(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: { roomId: string }) {
    const userId = validateClient(client);
    if (!userId) return;
    await this.roomHandler.handleGetRoomOnlineMembers(client, this.server, data.roomId);
  }

  @SubscribeMessage('client_delete_room')
  async handleClientDeleteRoom(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: { roomId: string }) {
    // Emit lại cho client để hiển thị thông báo
    client.emit(WS_RESPONSE_EVENTS.ROOM_DELETED, { roomId: data.roomId, message: 'Phòng đã được xoá.' });
    // Gửi lại danh sách phòng mới
    const userId = validateClient(client);
    if (userId) {
      const response = await this.roomHandler.handleGetRooms(userId);
      client.emit('rooms', response);
    }
  }

  @SubscribeMessage('client_leave_room')
  async handleClientLeaveRoom(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: { roomId: string }) {
    // Emit lại cho client để hiển thị thông báo
    client.emit(WS_RESPONSE_EVENTS.ROOM_LEFT, { roomId: data.roomId, message: 'Bạn đã rời khỏi phòng.' });
    // Gửi lại danh sách phòng mới
    const userId = validateClient(client);
    if (userId) {
      const response = await this.roomHandler.handleGetRooms(userId);
      client.emit('rooms', response);
    }
  }

  // ====== TIN NHẮN ======
  @SubscribeMessage('get_messages')
  @UsePipes(new ValidationPipe({ transform: true }))
  async handleGetMessages(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: GetMessagesDto) {
    const userId = validateClient(client);
    if (!userId) return;
    const response = await this.messageHandler.handleGetMessages(userId, data);
    client.emit('messages', response);
  }

  @SubscribeMessage('create_message')
  @UsePipes(new ValidationPipe({ transform: true }))
  async handleCreateMessage(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: CreateMessageDto & { roomId: string; fileData?: string }) {
    // Thêm log chi tiết
    const userId = validateClient(client);
    if (!userId) return;
    const response = await this.messageHandler.handleCreateMessage(this.server, userId, data);
    // Broadcast cho tất cả thành viên trong room
    this.server.to(data.roomId).emit('new_message', response);
  }

  @SubscribeMessage('mark_room_read')
  @UsePipes(new ValidationPipe({ transform: true }))
  async handleMarkRoomRead(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: MarkRoomReadDto) {
    const userId = validateClient(client);
    if (!userId) return;
    const response = await this.messageHandler.handleMarkRoomRead(this.server, userId, data);
    client.emit('mark_room_read_success', response);
  }

  @SubscribeMessage('get_unread_count')
  @UsePipes(new ValidationPipe({ transform: true }))
  async handleGetUnreadCount(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: GetUnreadCountDto) {
    const userId = validateClient(client);
    if (!userId) return;
    const response = await this.messageHandler.handleGetUnreadCount(userId, data);
    client.emit('unread_count', response);
  }

  // ====== USER ONLINE/OFFLINE ======
  @SubscribeMessage('user_offline')
  async handleUserOffline(@ConnectedSocket() client: AuthenticatedSocket) {
    const userId = validateClient(client);
    if (!userId) return;
    await this.userHandler.handleUserOffline(client, this.server, userId);
  }

  @SubscribeMessage('get_all_online_users')
  async handlerUserOnline(@ConnectedSocket() client: AuthenticatedSocket) {
    const userId = validateClient(client);
    if (!userId) return;
    const response = await this.userHandler.handleGetAllOnlineUsers();
    client.emit('all_online_users', response);
  }

  // ====== SUPPORT/ADMIN ======
  @SubscribeMessage('user_request_support')
  async handleUserRequestSupport(@ConnectedSocket() client: AuthenticatedSocket) {
    const userId = validateClient(client);
    if (!userId) return;
    await this.supportHandler.handleUserRequestSupport(client, this.server, userId);
  }

  @SubscribeMessage('admin_join_support_room')
  async handleAdminJoinSupportRoom(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: { roomId: string }) {
    const adminId = validateClient(client);
    if (!adminId) return;
    await this.supportHandler.handleAdminJoinSupportRoom(client, this.server, adminId, data.roomId);
  }

  @SubscribeMessage('close_support_room')
  async handleCloseSupportRoom(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: { roomId: string }) {
    const userId = validateClient(client);
    if (!userId) return;
    await this.supportHandler.handleCloseSupportRoom(client, this.server, userId, data.roomId);
  }

  @SubscribeMessage('get_pending_support_rooms')
  async handleGetPendingSupportRooms(@ConnectedSocket() client: AuthenticatedSocket) {
    const adminId = validateClient(client);
    if (!adminId) return;
    await this.supportHandler.handleGetPendingSupportRooms(client);
  }
}
