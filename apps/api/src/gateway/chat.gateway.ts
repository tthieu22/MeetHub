import { WebSocketGateway, OnGatewayConnection, OnGatewayDisconnect, WebSocketServer, SubscribeMessage, ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
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

//
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
  ALL_ONLINE = 'all_online_users',
}
// CORS
@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/',
  transports: ['websocket'],
})
// Xác thực người dùng
@UseGuards(WsAuthGuard)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  constructor(
    private chatService: ChatService,
    private wsAuthService: WsAuthService,
    private chatEventsHandler: ChatEventsHandler,
  ) {}
  // hành động connect
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
      client.emit(WebSocketEventName.AUTH_ERROR, response);
      client.disconnect();
      return;
    }

    const { user } = client;
    if (!user?._id) {
      const response: WsResponse = {
        success: false,
        message: 'User không xác thực',
        code: 'USER_INVALID',
      };
      client.emit(WebSocketEventName.AUTH_ERROR, response);
      client.disconnect();
      return;
    }
    const userId = user._id;

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

    await this.emitUserOnline(userId, roomIds);
    const response: WsResponse = {
      success: true,
      data: { userId, rooms: roomIds },
    };
    client.emit(WebSocketEventName.CONNECTION_SUCCESS, response);
    // Ensure every user joins their own user:{userId} room for direct events
    await client.join(`user:${user._id}`);
    if (user.role === 'admin') {
      const assignedRooms = await this.chatService.assignPendingRoomsToAdmins();
      const assignedRoom = assignedRooms?.[0];
      if (assignedRoom) {
        this.server.to(`user:${assignedRoom.userId}`).emit('support_room_assigned', {
          roomId: String(assignedRoom.roomId),
          admin: {
            _id: user._id,
            name: user.name,
          },
        });
        this.server.to(`user:${user._id}`).emit('support_ticket_assigned', {
          roomId: String(assignedRoom.roomId),
          userId: String(assignedRoom.userId),
        });
      }
    }
  }
  // hành động disconnect
  async handleDisconnect(client: AuthenticatedSocket): Promise<void> {
    const userId = client.user?._id as string | undefined;
    if (!userId) return;
    if (this.chatService['redisClient']) {
      await this.chatService['redisClient'].del(`user:online:${userId}`);
    }
  }

  // Emit realtime online cho tất cả client trong phòng khi có user online
  async emitRoomOnlineMembers(roomId: string) {
    const onlineMemberIds = await this.chatService.getOnlineMemberIds(roomId);
    const response: WsResponse = {
      success: true,
      data: { roomId, onlineMemberIds },
    };
    this.server.to(`room:${roomId}`).emit('room_online_members', response);
  }

  // Hành động lấy người online cho từng room
  async emitUserOnline(userId: string, roomIds: string[]): Promise<void> {
    for (const roomId of roomIds) {
      const response: WsResponse = {
        success: true,
        data: { userId, roomId },
      };
      this.server.to(`room:${roomId}`).emit(WebSocketEventName.USER_ONLINE, response);
      await this.emitRoomOnlineMembers(roomId);
    }

    // Emit all_online_users để cập nhật danh sách tổng thể
    const allOnlineResponse = await this.chatEventsHandler.handleGetAllOnlineUsers();
    this.server.emit('all_online_users', allOnlineResponse);
  }

  // lấy tất cả các phòng
  @SubscribeMessage('get_rooms')
  async handleGetRooms(@ConnectedSocket() client: AuthenticatedSocket) {
    const userId = validateClient(client);
    if (!userId) return;
    const response = await this.chatEventsHandler.handleGetRooms(userId);
    client.emit(WebSocketEventName.ROOMS, response);
  }

  // Lấy tin nhắn khi vào 1 phòng
  @SubscribeMessage('get_messages')
  @UsePipes(new ValidationPipe({ transform: true }))
  async handleGetMessages(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: GetMessagesDto) {
    const userId = validateClient(client);
    if (!userId) return;

    const response = await this.chatEventsHandler.handleGetMessages(userId, data);
    client.emit(WebSocketEventName.MESSAGES, response);
  }

  // Đánh dấu đọc tin nhắn
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

  // lấy tin nhắn chưa đọc của người dùng đăng nhập
  @SubscribeMessage('get_unread_count')
  @UsePipes(new ValidationPipe({ transform: true }))
  async handleGetUnreadCount(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: GetUnreadCountDto) {
    const userId = validateClient(client);
    if (!userId) return;

    const response = await this.chatEventsHandler.handleGetUnreadCount(userId, data);
    client.emit(WebSocketEventName.UNREAD_COUNT, response);
  }

  // gửi 1 tin nhắn sẽ gửi tới tất cả từng người 1 trong phòng và đánh dấu chưa đọc
  @SubscribeMessage('create_message')
  @UsePipes(new ValidationPipe({ transform: true }))
  async handleCreateMessage(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: CreateMessageDto & { roomId: string; fileData?: string }) {
    const userId = validateClient(client);
    if (!userId) return;

    const response = await this.chatEventsHandler.handleCreateMessage(userId, data);
    client.emit(WebSocketEventName.MESSAGE_CREATED, response);

    if (response.success) {
      this.server.to(`room:${data.roomId}`).emit(WebSocketEventName.NEW_MESSAGE, response);
      const roomMembers: { userId: { _id: any } }[] = await this.chatService.getRoomMembers(data.roomId, userId);
      await Promise.all(
        roomMembers.map(async (member) => {
          const memberId: string = String(member.userId._id);
          const unreadCount = await this.chatService.getUnreadCount(data.roomId, memberId);
          const unreadResponse: WsResponse = {
            success: true,
            data: { roomId: data.roomId, unreadCount },
          };
          this.server.to(`user:${memberId}`).emit(WebSocketEventName.UNREAD_COUNT_UPDATED, unreadResponse);
        }),
      );
    }
  }

  // Khi tham gia tham gia vào 1 phòng
  @SubscribeMessage('join_room')
  @UsePipes(new ValidationPipe({ transform: true }))
  async handleJoinRoom(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: { roomId: string }) {
    const userId = validateClient(client);
    if (!userId) return;
    const response = await this.chatEventsHandler.handleJoinRoom(userId, data.roomId);
    if (response.success) {
      await client.join(`room:${data.roomId}`);
      await client.join(`user:${userId}`);
      const onlineMemberIds = await this.chatService.getOnlineMemberIds(data.roomId);
      const onlineResponse: WsResponse = {
        success: true,
        data: { roomId: data.roomId, onlineMemberIds },
      };
      this.server.to(`room:${data.roomId}`).emit('room_online_members', onlineResponse);
    }
    client.emit(WebSocketEventName.ROOM_JOINED, response);
  }

  // Lấy số người online cho từng phòng
  @SubscribeMessage('get_room_online_members')
  async handleGetRoomOnlineMembers(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: { roomId: string }) {
    const userId = validateClient(client);
    if (!userId) return;
    try {
      const onlineMemberIds = await this.chatService.getOnlineMemberIds(data.roomId);
      const response: WsResponse = {
        success: true,
        data: { roomId: data.roomId, onlineMemberIds },
      };
      client.emit('room_online_members', response);
    } catch (err) {
      emitError(client, 'GET_ONLINE_MEMBERS_ERROR', (err as Error).message, 'room_online_members');
    }
  }

  // Khi offline sẽ xoá khỏi redis lấy lại thông tin các phòng tổng số thành viên online của từng phòng cập nhật lại
  @SubscribeMessage('user_offline')
  async handleUserOffline(@ConnectedSocket() client: AuthenticatedSocket) {
    const userId = validateClient(client);
    if (!userId) return;

    if (this.chatService['redisClient']) {
      await this.chatService['redisClient'].del(`user:online:${userId}`);
    }

    const rooms: { roomId: string }[] = await this.chatService.getRooms(userId);
    const roomIds = rooms.map((r) => r.roomId);

    await Promise.all(
      roomIds.map(async (roomId) => {
        const response: WsResponse = {
          success: true,
          data: { userId, roomId },
        };
        this.server.to(`room:${roomId}`).emit(WebSocketEventName.USER_OFFLINE, response);

        await this.emitRoomOnlineMembers(roomId);
      }),
    );

    // Emit all_online_users để cập nhật danh sách tổng thể
    const allOnlineResponse = await this.chatEventsHandler.handleGetAllOnlineUsers();
    this.server.emit('all_online_users', allOnlineResponse);
  }

  @SubscribeMessage('get_all_online_users')
  async handlerUserOnline(@ConnectedSocket() client: AuthenticatedSocket) {
    const userId = validateClient(client);
    if (!userId) return;

    const response = await this.chatEventsHandler.handleGetAllOnlineUsers();
    client.emit('all_online_users', response);
  }

  // Khi user click chat với admin
  @SubscribeMessage('user_request_support')
  async handleUserRequestSupport(@ConnectedSocket() client: AuthenticatedSocket) {
    const userId = validateClient(client);
    if (!userId) return;
    try {
      // Gán admin và tạo/tìm phòng
      const { roomId, admin, pending } = await this.chatService.assignAdminToUser(userId);
      // Join user vào phòng socket
      await client.join(`room:${String(roomId)}`);
      if (pending) {
        // Nếu chưa có admin online, gửi event pending cho user
        client.emit('support_room_pending', { roomId: String(roomId) });
        return;
      }
      // Gửi notification cho admin (nếu online)
      if (admin && admin._id) {
        this.server.to(`user:${String(admin._id)}`).emit('support_ticket_assigned', { roomId: String(roomId), userId: String(userId) });
        // Emit support_room_assigned cho admin luôn
        this.server.to(`user:${String(admin._id)}`).emit('support_room_assigned', { roomId: String(roomId), admin });
      }
      // Gửi về cho user roomId và thông tin admin
      client.emit('support_room_assigned', { roomId: String(roomId), admin });
    } catch (err) {
      emitError(client, 'ASSIGN_ADMIN_ERROR', err instanceof Error ? err.message : String(err), 'support_room_assigned');
    }
  }

  @SubscribeMessage('admin_join_support_room')
  async handleAdminJoinSupportRoom(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: { roomId: string }) {
    const adminId = validateClient(client);
    if (!adminId) return;
    // 1. Cập nhật phòng: thêm admin vào memberIds, assignedAdmins, currentAdminId, pending=false
    const room = await this.chatService.adminJoinRoom(data.roomId, adminId);
    if (!room) {
      client.emit('error', { message: 'Không tìm thấy phòng' });
      return;
    }
    // 2. Join socket room
    await client.join(`room:${data.roomId}`);
    // 3. Gửi event cho user
    const userIdObj = room.memberIds.find((id) => id.toString() !== adminId.toString());
    const userId = userIdObj?.toString();
    if (userId) {
      this.server.to(`user:${userId}`).emit('support_admin_joined', {
        roomId: data.roomId,
        admin: { _id: adminId, name: client.user.name },
      });
    }
    // 4. Gửi event cho admin (nếu muốn)
    client.emit('support_ticket_assigned', {
      roomId: data.roomId,
      userId,
    });
  }

  // Đóng phòng chat support
  @SubscribeMessage('close_support_room')
  async handleCloseSupportRoom(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: { roomId: string }) {
    const userId = validateClient(client);
    if (!userId) return;
    // Đảm bảo user là thành viên của phòng
    const isMember = await this.chatService.validateRoomMembership(userId, data.roomId);
    if (!isMember) {
      client.emit('support_room_closed', { success: false, message: 'Bạn không phải thành viên phòng này' });
      return;
    }
    // Cập nhật trạng thái phòng (ví dụ: set closed = true)
    await this.chatService.closeSupportRoom(data.roomId, userId);
    // Emit tới tất cả thành viên phòng
    this.server.to(`room:${data.roomId}`).emit('support_room_closed', { roomId: data.roomId, closedBy: userId });
  }
}

function emitError(client: AuthenticatedSocket, code: string, message: string, event: string = 'error') {
  const response: WsResponse = {
    success: false,
    message,
    code,
  };
  client.emit(event, response);
}

// Validate người dùng
function validateClient(client: AuthenticatedSocket, event: string = 'error'): string | undefined {
  const userId = client.user?._id as string | undefined;
  if (!userId) {
    emitError(client, 'USER_INVALID', 'User không xác thực', event);
    return undefined;
  }
  return userId;
}
