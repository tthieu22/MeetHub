import { Injectable, Logger } from '@nestjs/common';
import { Socket, Namespace } from 'socket.io';
import { MessageService } from '@api/modules/chat-message/message.service';
import { OnlineUsersService } from '@api/modules/chat-user/online-users.service';
import { TokenOnlineService } from '@api/modules/chat-user/token-online.service';
import { ChatMessageData, SavedMessage, PopulatedMessage } from '@api/gateway/chat-gateway.types';
import { RoomService } from '@api/modules/chat-room/room.service';
import { NotificationService } from '@api/modules/chat-notification/notification.service';
import { UserChatService } from '@api/modules/chat-user/user-chat.service';
import { ReactionService } from '@api/modules/chat-reactions/reaction.service';

@Injectable()
export class ChatService {
  private logger = new Logger('ChatService');

  constructor(
    private messageService: MessageService,
    private onlineUsersService: OnlineUsersService,
    private tokenOnlineService: TokenOnlineService,
    private roomService: RoomService,
    private notificationService: NotificationService,
    private userChatService: UserChatService,
    private reactionService: ReactionService,
  ) {}

  /**
   * Xử lý tin nhắn mới từ client
   */
  async handleNewMessage(data: ChatMessageData): Promise<SavedMessage & { lastMessage?: any }> {
    this.logger.log(`Processing new message: ${JSON.stringify(data)}`);

    // Lưu tin nhắn vào database
    const savedMessage = await this.messageService.createMessage({ text: data.text }, data.senderId, data.roomId);

    // Lấy lại conversation để lấy lastMessage mới nhất
    const conversation = await this.messageService['conversationModel'].findById(data.roomId).lean();
    console.log('DEBUG conversation:', conversation);
    // Chuyển savedMessage sang object thường để type-safe
    const msgObj = typeof savedMessage.toObject === 'function' ? savedMessage.toObject() : savedMessage;
    this.logger.log(`Message saved to database with ID: ${String(msgObj._id)}`);

    // Tạo tin nhắn đầy đủ để trả về, kèm lastMessage
    return {
      ...this.formatMessageForClient(msgObj as unknown as PopulatedMessage),
      lastMessage: conversation?.lastMessage,
    };
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
   * Lấy lịch sử tin nhắn của 1 phòng (dùng service chuẩn)
   */
  async getMessagesHistory(roomId: string): Promise<SavedMessage[]> {
    const { data } = await this.messageService.getMessages(roomId, 1, 100);
    return data.map((msg: any) => this.formatMessageForClient(msg));
  }

  /**
   * Gửi tin nhắn mới (dùng service chuẩn)
   */
  async createMessage(data: ChatMessageData) {
    return this.messageService.createMessage({ text: data.text }, data.senderId, data.roomId);
  }

  /**
   * Xóa tin nhắn (dùng service chuẩn)
   */
  async deleteMessage(messageId: string, userId: string) {
    return this.messageService.deleteMessage(messageId, userId);
  }

  /**
   * Ghim hoặc bỏ ghim tin nhắn (dùng service chuẩn)
   */
  async togglePinMessage(messageId: string, userId: string) {
    return this.messageService.togglePinMessage(messageId, userId);
  }

  /**
   * Đánh dấu tin nhắn là đã đọc (dùng service chuẩn)
   */
  async markAsRead(messageId: string, userId: string) {
    return this.messageService.markAsRead(messageId, userId);
  }

  /**
   * Format tin nhắn để gửi cho client
   */
  private formatMessageForClient(savedMessage: PopulatedMessage): SavedMessage {
    return {
      id: savedMessage._id.toString(),
      text: savedMessage.text,
      senderId: savedMessage.senderId._id.toString(),
      roomId: savedMessage.conversationId.toString(),
      createdAt: savedMessage.createdAt.toISOString(),
      sender: savedMessage.senderId,
    };
  }

  /**
   * Broadcast tin nhắn đến tất cả clients khác trong room
   */
  broadcastMessage(client: Socket, message: SavedMessage) {
    this.logger.log(`Broadcasting message to all other clients in room ${message.roomId}`);
    client.to(message.roomId).emit('chat:message:new', message);
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
      originalData: originalData as object,
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

  /**
   * Emit event cập nhật phòng cho tất cả client
   */
  async emitRoomUpdated(io: Namespace, roomId: string, userId: string) {
    // Lấy thông tin phòng đã cập nhật
    const room = await this.roomService.getRoom(roomId, userId);
    console.log('EMIT chat:room:updated room:', JSON.stringify(room));
    io.to(roomId).emit('chat:room:updated', room);
  }

  /**
   * Gửi notification mới
   */

  /**
   * Thêm thành viên vào phòng
   */
  async addMember(roomId: string, userId: string, clientId?: string): Promise<{ success: boolean }> {
    await this.roomService.addMember(roomId, userId, clientId ?? '');
    return { success: true };
  }

  /**
   * Block user
   */

  /**
   * Xóa thành viên khỏi phòng
   */
  async removeMember(roomId: string, userId: string): Promise<{ success: boolean }> {
    await this.roomService.removeMember(roomId, userId, '');
    return { success: true };
  }

  /**
   * Unblock user
   */

  /**
   * Lấy thông tin phòng
   */
  async getRoom(roomId: string, userId: string) {
    return this.roomService.getRoom(roomId, userId);
  }

  /**
   * Lấy danh sách user bị block
   */

  /**
   * Lấy danh sách notification
   */

  /**
   * Lấy danh sách user được mention trong tin nhắn
   */
  async getMessageMentions(messageId: string) {
    return this.messageService.getMessageMentions(messageId);
  }

  /**
   * Upload file cho tin nhắn
   */
  async uploadFile(messageId: string, file: any, userId: string) {
    return this.messageService.uploadFile(messageId, file, userId);
  }

  /**
   * Lấy danh sách file đính kèm của tin nhắn
   */
  async getMessageFiles(messageId: string) {
    return this.messageService.getMessageFiles(messageId);
  }

  async addReaction(messageId: string, userId: string, emoji: string): Promise<any> {
    return this.reactionService.addReaction(messageId, userId, emoji);
  }

  async removeReaction(messageId: string, userId: string, emoji: string): Promise<any> {
    return this.reactionService.removeReaction(messageId, userId, emoji);
  }
}
