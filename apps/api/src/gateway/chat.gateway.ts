import { WebSocketGateway, OnGatewayConnection, OnGatewayDisconnect, WebSocketServer, SubscribeMessage, ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { ChatService } from '@api/gateway/chat.service';
import { WsAuthGuard, AuthenticatedSocket } from '@api/common/guards/ws-auth.guard';
import { Server } from 'socket.io';
import { RoomSidebarInfo } from '@api/modules/chat/chat-room/interfaces/room-sidebar.interface';
import { WsAuthService } from '@api/common/services/ws-auth.service';
import { GetMessagesDto } from '@api/modules/chat/chat-message/dto/get-messages.dto';
import { MarkRoomReadDto } from '@api/modules/chat/chat-message/dto/mark-room-read.dto';
import { GetUnreadCountDto } from '@api/modules/chat/chat-message/dto/get-unread-count.dto';
import { WsResponse } from '@api/common/interfaces/ws-response.interface';
import { CreateMessageDto } from '@api/modules/chat/chat-message/dto/create-message.dto';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/',
  transports: ['websocket'],
})
@UseGuards(WsAuthGuard)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  constructor(
    private chatService: ChatService,
    private wsAuthService: WsAuthService,
  ) {}

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    try {
      const payload = await this.wsAuthService.validateToken(client);
      client.user = payload;
    } catch (err) {
      const response: WsResponse = {
        success: false,
        message: (err as Error).message,
        code: 'TOKEN_INVALID',
      };
      client.emit('auth_error', response);
      client.disconnect();
      return;
    }

    const { user } = client;
    if (!user?.sub) {
      const response: WsResponse = {
        success: false,
        message: 'User không xác thực',
        code: 'USER_INVALID',
      };
      client.emit('auth_error', response);
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
      client.emit('error', response);
      return;
    }
    this.emitUserOnline(userId, roomIds);
    const response: WsResponse = {
      success: true,
      data: { userId, rooms: roomIds },
    };
    client.emit('connection_success', response);
  }

  handleDisconnect(): void {}

  emitUserOnline(userId: string, roomIds: string[]): void {
    roomIds.forEach((roomId) => {
      const response: WsResponse = {
        success: true,
        data: { userId, roomId },
      };
      this.server.to(`room:${roomId}`).emit('user_online', response);
    });
  }
  @SubscribeMessage('get_rooms')
  async handleGetRooms(@ConnectedSocket() client: AuthenticatedSocket) {
    const user = client.user;
    if (!user?.sub) {
      const response: WsResponse = {
        success: false,
        message: 'User không xác thực',
        code: 'USER_INVALID',
      };
      client.emit('error', response);
      return;
    }
    const userId = user.sub;
    const rooms: RoomSidebarInfo[] = await this.chatService.getRoomSidebarInfo(userId);
    const response: WsResponse = {
      success: true,
      data: rooms,
    };
    client.emit('rooms', response);
  }

  @SubscribeMessage('get_messages')
  async handleGetMessages(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: GetMessagesDto) {
    const user = client.user;
    if (!user?.sub) {
      const response: WsResponse = {
        success: false,
        message: 'User không xác thực',
        code: 'USER_INVALID',
      };
      client.emit('error', response);
      return;
    }

    try {
      const userId = user.sub;

      // Kiểm tra user có phải member của room không
      const isMember = await this.chatService.validateRoomMembership(userId, data.roomId);
      if (!isMember) {
        const response: WsResponse = {
          success: false,
          message: 'Bạn không phải member của room này',
          code: 'NOT_MEMBER',
        };
        client.emit('error', response);
        return;
      }

      const before = data.before ? new Date(data.before) : undefined;
      const messages = await this.chatService.getMessages(data.roomId, 1, data.limit || 20, before);

      const response: WsResponse = {
        success: true,
        data: messages,
      };
      client.emit('messages', response);
    } catch (error) {
      const response: WsResponse = {
        success: false,
        message: error instanceof Error ? error.message : 'Lỗi khi lấy tin nhắn',
        code: 'GET_MESSAGES_ERROR',
      };
      client.emit('error', response);
    }
  }

  @SubscribeMessage('mark_room_read')
  async handleMarkRoomRead(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: MarkRoomReadDto) {
    const user = client.user;
    if (!user?.sub) {
      const response: WsResponse = {
        success: false,
        message: 'User không xác thực',
        code: 'USER_INVALID',
      };
      client.emit('error', response);
      return;
    }

    try {
      const userId = user.sub;

      // Kiểm tra user có phải member của room không
      const isMember = await this.chatService.validateRoomMembership(userId, data.roomId);
      if (!isMember) {
        const response: WsResponse = {
          success: false,
          message: 'Bạn không phải member của room này',
          code: 'NOT_MEMBER',
        };
        client.emit('error', response);
        return;
      }

      await this.chatService.markAllAsRead(data.roomId, userId);

      // Emit cho tất cả user khác trong room
      const notification: WsResponse = {
        success: true,
        data: {
          roomId: data.roomId,
          userId: userId,
          markedAt: new Date(),
        },
      };
      this.server.to(`room:${data.roomId}`).emit('room_marked_read', notification);

      const response: WsResponse = {
        success: true,
        message: 'Đã đánh dấu đọc thành công',
      };
      client.emit('mark_room_read_success', response);
    } catch (error) {
      const response: WsResponse = {
        success: false,
        message: error instanceof Error ? error.message : 'Lỗi khi đánh dấu đọc',
        code: 'MARK_ROOM_READ_ERROR',
      };
      client.emit('error', response);
    }
  }

  @SubscribeMessage('get_unread_count')
  async handleGetUnreadCount(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: GetUnreadCountDto) {
    const user = client.user;
    if (!user?.sub) {
      const response: WsResponse = {
        success: false,
        message: 'User không xác thực',
        code: 'USER_INVALID',
      };
      client.emit('error', response);
      return;
    }

    try {
      const userId = user.sub;

      // Kiểm tra user có phải member của room không
      const isMember = await this.chatService.validateRoomMembership(userId, data.roomId);
      if (!isMember) {
        const response: WsResponse = {
          success: false,
          message: 'Bạn không phải member của room này',
          code: 'NOT_MEMBER',
        };
        client.emit('error', response);
        return;
      }

      const unreadCount = await this.chatService.getUnreadCount(data.roomId, userId);

      const response: WsResponse = {
        success: true,
        data: { roomId: data.roomId, unreadCount },
      };
      client.emit('unread_count', response);
    } catch (error) {
      const response: WsResponse = {
        success: false,
        message: error instanceof Error ? error.message : 'Lỗi khi lấy số tin nhắn chưa đọc',
        code: 'GET_UNREAD_COUNT_ERROR',
      };
      client.emit('error', response);
    }
  }

  @SubscribeMessage('create_message')
  async handleCreateMessage(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: CreateMessageDto & { roomId: string }) {
    const user = client.user;
    if (!user?.sub) {
      const response: WsResponse = {
        success: false,
        message: 'User không xác thực',
        code: 'USER_INVALID',
      };
      client.emit('error', response);
      return;
    }

    try {
      const userId = user.sub;

      // Kiểm tra user có phải member của room không
      const isMember = await this.chatService.validateRoomMembership(userId, data.roomId);
      if (!isMember) {
        const response: WsResponse = {
          success: false,
          message: 'Bạn không phải member của room này',
          code: 'NOT_MEMBER',
        };
        client.emit('error', response);
        return;
      }

      // Tạo tin nhắn mới
      const message = await this.chatService.createMessage(data, data.roomId, userId);

      // Emit tin nhắn mới cho tất cả user trong room
      const messageResponse: WsResponse = {
        success: true,
        data: message,
      };
      this.server.to(`room:${data.roomId}`).emit('new_message', messageResponse);

      // Cập nhật unread count cho tất cả user khác (trừ người gửi)
      const roomMembers = await this.chatService.getRoomMembers(data.roomId, userId);
      const otherMembers = roomMembers.filter((member) => member.userId.toString() !== userId);

      for (const member of otherMembers) {
        const unreadCount = await this.chatService.getUnreadCount(data.roomId, member.userId.toString());
        const unreadResponse: WsResponse = {
          success: true,
          data: { roomId: data.roomId, unreadCount },
        };
        this.server.to(`user:${member.userId.toString()}`).emit('unread_count_updated', unreadResponse);
      }

      const response: WsResponse = {
        success: true,
        data: message,
      };
      client.emit('message_created', response);
    } catch (error) {
      const response: WsResponse = {
        success: false,
        message: error instanceof Error ? error.message : 'Lỗi khi tạo tin nhắn',
        code: 'CREATE_MESSAGE_ERROR',
      };
      client.emit('error', response);
    }
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: { roomId: string }) {
    const user = client.user;
    if (!user?.sub) {
      const response: WsResponse = {
        success: false,
        message: 'User không xác thực',
        code: 'USER_INVALID',
      };
      client.emit('error', response);
      return;
    }

    try {
      const userId = user.sub;

      // Kiểm tra user có phải member của room không
      const isMember = await this.chatService.validateRoomMembership(userId, data.roomId);
      if (!isMember) {
        const response: WsResponse = {
          success: false,
          message: 'Bạn không phải member của room này',
          code: 'NOT_MEMBER',
        };
        client.emit('error', response);
        return;
      }

      // Join vào room
      await client.join(`room:${data.roomId}`);

      // Join vào user room để nhận notifications cá nhân
      await client.join(`user:${userId}`);

      const response: WsResponse = {
        success: true,
        message: `Đã join vào room ${data.roomId}`,
      };
      client.emit('room_joined', response);
    } catch (error) {
      const response: WsResponse = {
        success: false,
        message: error instanceof Error ? error.message : 'Lỗi khi join room',
        code: 'JOIN_ROOM_ERROR',
      };
      client.emit('error', response);
    }
  }
}
