import { WebSocketGateway, OnGatewayConnection, OnGatewayDisconnect, WebSocketServer, SubscribeMessage, ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { UseGuards, UsePipes, ValidationPipe, Logger } from '@nestjs/common';
import { ChatService } from '@api/gateway/chat.service';
import { WsAuthGuard, AuthenticatedSocket } from '@api/common/guards/ws-auth.guard';
import { Server } from 'socket.io';
import { WsAuthService } from '@api/common/services/ws-auth.service';
import { GetMessagesDto } from '@api/modules/chat/chat-message/dto/get-messages.dto';
import { MarkRoomReadDto } from '@api/modules/chat/chat-message/dto/mark-room-read.dto';
import { GetUnreadCountDto } from '@api/modules/chat/chat-message/dto/get-unread-count.dto';
import { WsResponse } from '@api/common/interfaces/ws-response.interface';
import { CreateMessageDto } from '@api/modules/chat/chat-message/dto/create-message.dto';
import { ChatEventsHandler } from './chat-events.handler';

export enum WebSocketEventName {
  ERROR = 'error',
  AUTH_ERROR = 'auth_error',
  CONNECTION_SUCCESS = 'connection_success',
  ROOMS = 'rooms',
  MESSAGES = 'messages',
  MARK_ROOM_READ_SUCCESS = 'mark_room_read_success',
  ROOM_MARKED_READ = 'room_marked_read',
  UNREAD_COUNT = 'unread_count',
  UNREAD_COUNT_UPDATED = 'unread_count_updated',
  MESSAGE_CREATED = 'message_created',
  NEW_MESSAGE = 'new_message',
  ROOM_JOINED = 'room_joined',
  USER_ONLINE = 'user_online',
  USER_OFFLINE = 'user_offline',
}

function emitError(client: AuthenticatedSocket, code: string, message: string, event: string = 'error') {
  const response: WsResponse = {
    success: false,
    message,
    code,
  };
  client.emit(event, response);
}

function validateClient(client: AuthenticatedSocket, event: string = 'error'): string | undefined {
  const userId = client.user?.sub;
  if (!userId) {
    emitError(client, 'USER_INVALID', 'User không xác thực', event);
    return undefined;
  }
  return userId;
}

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/',
  transports: ['websocket'],
})
@UseGuards(WsAuthGuard)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(ChatGateway.name);
  constructor(
    private chatService: ChatService,
    private wsAuthService: WsAuthService,
    private chatEventsHandler: ChatEventsHandler,
  ) {}

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    try {
      const payload = await this.wsAuthService.validateToken(client);
      client.user = payload;
      this.logger.log(`Client connected: userId=${payload?.sub}`);
    } catch (err) {
      const response: WsResponse = {
        success: false,
        message: (err as Error).message,
        code: 'TOKEN_INVALID',
      };
      client.emit(WebSocketEventName.AUTH_ERROR, response);
      client.disconnect();
      this.logger.warn(`Auth error on connect: ${err}`);
      return;
    }

    const { user } = client;
    if (!user?.sub) {
      const response: WsResponse = {
        success: false,
        message: 'User không xác thực',
        code: 'USER_INVALID',
      };
      client.emit(WebSocketEventName.AUTH_ERROR, response);
      client.disconnect();
      return;
    }
    const userId = user.sub;
    const rooms = await this.chatService.getRooms(userId);
    const roomIds = rooms.map((r) => r.roomId);
    await Promise.all(roomIds.map((roomId) => client.join(`room:${roomId}`)));
    const onlineResult = await this.chatService.setUserOnline(userId);
    if (!onlineResult.success) {
      const response: WsResponse = {
        success: false,
        message: 'Không thể đánh dấu online',
        code: 'REDIS_ERROR',
      };
      client.emit(WebSocketEventName.ERROR, response);
      return;
    }
    this.emitUserOnline(userId, roomIds);
    const response: WsResponse = {
      success: true,
      data: { userId, rooms: roomIds },
    };
    client.emit(WebSocketEventName.CONNECTION_SUCCESS, response);
  }

  async handleDisconnect(client: AuthenticatedSocket): Promise<void> {
    const userId = client.user?.sub;
    if (!userId) return;
    if (this.chatService['redisClient']) {
      await this.chatService['redisClient'].del(`user:online:${userId}`);
    }
    const rooms: { roomId: string }[] = await this.chatService.getRooms(userId);
    const roomIds = rooms.map((r) => r.roomId);
    roomIds.forEach((roomId) => {
      const response: WsResponse = {
        success: true,
        data: { userId, roomId },
      };
      this.server.to(`room:${roomId}`).emit(WebSocketEventName.USER_OFFLINE, response);
    });
    this.logger.log(`Client disconnected: userId=${userId}`);
  }

  emitUserOnline(userId: string, roomIds: string[]): void {
    roomIds.forEach((roomId) => {
      const response: WsResponse = {
        success: true,
        data: { userId, roomId },
      };
      this.server.to(`room:${roomId}`).emit(WebSocketEventName.USER_ONLINE, response);
      this.logger.log(`Emit user_online: userId=${userId}, roomId=${roomId}`);
    });
  }
  @SubscribeMessage('get_rooms')
  async handleGetRooms(@ConnectedSocket() client: AuthenticatedSocket) {
    const userId = validateClient(client);
    if (!userId) return;
    const response = await this.chatEventsHandler.handleGetRooms(userId);
    client.emit(WebSocketEventName.ROOMS, response);
  }

  @SubscribeMessage('get_messages')
  @UsePipes(new ValidationPipe({ transform: true }))
  async handleGetMessages(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: GetMessagesDto) {
    const userId = validateClient(client);
    if (!userId) return;
    this.logger.log(`get_messages: userId=${userId}, roomId=${data.roomId}`);
    const response = await this.chatEventsHandler.handleGetMessages(userId, data);
    client.emit(WebSocketEventName.MESSAGES, response);
  }

  @SubscribeMessage('mark_room_read')
  @UsePipes(new ValidationPipe({ transform: true }))
  async handleMarkRoomRead(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: MarkRoomReadDto) {
    const userId = validateClient(client);
    if (!userId) return;
    const response = await this.chatEventsHandler.handleMarkRoomRead(userId, data);
    client.emit(WebSocketEventName.MARK_ROOM_READ_SUCCESS, response);
    if (response.success) {
      this.server.to(`room:${data.roomId}`).emit(WebSocketEventName.ROOM_MARKED_READ, response);
    }
  }

  @SubscribeMessage('get_unread_count')
  @UsePipes(new ValidationPipe({ transform: true }))
  async handleGetUnreadCount(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: GetUnreadCountDto) {
    const userId = validateClient(client);
    if (!userId) return;
    const response = await this.chatEventsHandler.handleGetUnreadCount(userId, data);
    client.emit(WebSocketEventName.UNREAD_COUNT, response);
  }

  @SubscribeMessage('create_message')
  @UsePipes(new ValidationPipe({ transform: true }))
  async handleCreateMessage(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: CreateMessageDto & { roomId: string }) {
    const userId = validateClient(client);
    if (!userId) return;
    this.logger.log(`create_message: userId=${userId}, roomId=${data.roomId}`);
    const response = await this.chatEventsHandler.handleCreateMessage(userId, data);
    client.emit(WebSocketEventName.MESSAGE_CREATED, response);
    if (response.success) {
      this.server.to(`room:${data.roomId}`).emit(WebSocketEventName.NEW_MESSAGE, response);
      this.logger.log(`[DEBUG] Emit NEW_MESSAGE to room: ${data.roomId}`);
      const roomMembers: { userId: { _id: any } }[] = await this.chatService.getRoomMembers(data.roomId, userId);
      this.logger.log(`[DEBUG] roomMembers: ${roomMembers.map((m) => String(m.userId && m.userId._id)).join(', ')}`);
      const otherMembers = roomMembers.filter((member) => member.userId && member.userId._id && String(member.userId._id) !== userId);
      this.logger.log(`[DEBUG] otherMembers: ${otherMembers.map((m) => String(m.userId && m.userId._id)).join(', ')}`);
      await Promise.all(
        otherMembers.map(async (member) => {
          const memberId: string = String(member.userId._id);
          const unreadCount = await this.chatService.getUnreadCount(data.roomId, memberId);
          const unreadResponse: WsResponse = {
            success: true,
            data: { roomId: data.roomId, unreadCount },
          };
          this.logger.log(`[DEBUG] Emit UNREAD_COUNT_UPDATED to user: ${memberId}, unreadCount: ${unreadCount}`);
          this.server.to(`user:${memberId}`).emit(WebSocketEventName.UNREAD_COUNT_UPDATED, unreadResponse);
        }),
      );
    }
  }

  @SubscribeMessage('join_room')
  @UsePipes(new ValidationPipe({ transform: true }))
  async handleJoinRoom(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: { roomId: string }) {
    const userId = validateClient(client);
    if (!userId) return;
    const response = await this.chatEventsHandler.handleJoinRoom(userId, data.roomId);
    if (response.success) {
      await client.join(`room:${data.roomId}`);
      await client.join(`user:${userId}`);
    }
    client.emit(WebSocketEventName.ROOM_JOINED, response);
  }
}
