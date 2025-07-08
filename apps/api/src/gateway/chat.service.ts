import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { MessageService } from '../modules/chat-message/message.service';
import { OnlineUsersService } from '../modules/chat-user/online-users.service';
import { TokenOnlineService } from '../modules/chat-user/token-online.service';

export interface ChatMessageData {
  text: string;
  senderId: string;
  roomId: string;
}

export interface SavedMessage {
  id: string;
  text: string;
  senderId: string;
  roomId: string;
  createdAt: string;
  sender: any;
}

@Injectable()
export class ChatService {
  private logger = new Logger('ChatService');

  constructor(
    private messageService: MessageService,
    private onlineUsersService: OnlineUsersService,
    private tokenOnlineService: TokenOnlineService,
  ) {}

  /**
   * Xử lý tin nhắn mới từ client
   */
  async handleNewMessage(data: ChatMessageData): Promise<SavedMessage> {
    this.logger.log(`Processing new message: ${JSON.stringify(data)}`);

    // Lưu tin nhắn vào database
    const savedMessage = await this.messageService.createMessage({ text: data.text }, data.senderId, data.roomId);

    this.logger.log(`Message saved to database with ID: ${(savedMessage as any)._id}`);

    // Tạo tin nhắn đầy đủ để trả về
    return this.formatMessageForClient(savedMessage);
  }

  /**
   * Xử lý user online với token
   */
  handleUserOnlineWithToken(token: string, clientId: string) {
    this.logger.log(`Processing user online with token for client ${clientId}`);

    const result = this.tokenOnlineService.addUserOnlineFromToken(token, clientId);

    if (result.success) {
      this.logger.log(`User ${result.userId} added to online list via token`);
    } else {
      this.logger.error(`Failed to add user online via token: ${result.message}`);
    }

    return result;
  }

  /**
   * Xử lý user online với userId
   */
  handleUserOnline(userId: string, clientId: string) {
    this.logger.log(`Processing user online: ${userId} for client ${clientId}`);
    this.onlineUsersService.addOnlineUser(clientId, userId);
  }

  /**
   * Xử lý user offline
   */
  handleUserOffline(clientId: string) {
    this.logger.log(`Processing user offline for client ${clientId}`);

    const result = this.tokenOnlineService.removeUserOnline(clientId);

    if (result.success) {
      this.logger.log(`Removed user ${result.userId} from online list due to disconnect`);
    }

    return result;
  }

  /**
   * Lấy danh sách user online
   */
  getOnlineUsers() {
    return this.onlineUsersService.getOnlineUsers();
  }

  /**
   * Lấy số lượng client đang connect
   */
  getClientCount() {
    return this.onlineUsersService.getClientCount();
  }

  /**
   * Format tin nhắn để gửi cho client
   */
  private formatMessageForClient(savedMessage: any): SavedMessage {
    return {
      id: (savedMessage as any)._id.toString(),
      text: (savedMessage as any).text,
      senderId: (savedMessage as any).senderId._id.toString(),
      roomId: (savedMessage as any).conversationId.toString(),
      createdAt: (savedMessage as any).createdAt.toISOString(),
      sender: (savedMessage as any).senderId,
    };
  }

  /**
   * Broadcast tin nhắn đến tất cả clients khác
   */
  broadcastMessage(client: Socket, message: SavedMessage) {
    this.logger.log(`Broadcasting message to all other clients`);
    client.broadcast.emit('chat:message:new', message);
  }

  /**
   * Gửi confirmation cho client gửi tin nhắn
   */
  sendMessageConfirmation(client: Socket, message: SavedMessage) {
    this.logger.log(`Sending message confirmation to client ${client.id}`);
    client.emit('chat:message:saved', message);
  }

  /**
   * Gửi lỗi cho client
   */
  sendErrorMessage(client: Socket, error: string, originalData: any) {
    this.logger.error(`Sending error to client ${client.id}: ${error}`);
    client.emit('chat:message:error', {
      error,
      originalData,
    });
  }

  /**
   * Broadcast danh sách user online
   */
  broadcastOnlineUsers(client: Socket) {
    const online = this.getOnlineUsers();
    this.logger.log(`Broadcasting online users: ${JSON.stringify(online)}`);

    // Broadcast đến tất cả clients khác và gửi cho client hiện tại
    client.broadcast.emit('users:online', online);
    client.emit('users:online', online);
  }
}
