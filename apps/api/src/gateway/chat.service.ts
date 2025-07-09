import { Injectable } from '@nestjs/common';
import { MessageService } from '@api/modules/chat/chat-message/message.service';
import { RoomService } from '@api/modules/chat/chat-room/room.service';
import { UserChatService } from '@api/modules/chat/chat-user/user-chat.service';
import { ReactionService } from '@api/modules/chat/chat-reactions/reaction.service';
import { UsersService } from '@api/modules/users/users.service';
import { CreateMessageDto } from '@api/modules/chat/chat-message/dto/create-message.dto';
import { CreateRoomDto } from '@api/modules/chat/chat-room/dto/create-room.dto';

@Injectable()
export class ChatService {
  constructor(
    private messageService: MessageService,
    private roomService: RoomService,
    private userChatService: UserChatService,
    private reactionService: ReactionService,
    private usersService: UsersService,
  ) {}

  // Message methods
  async createMessage(createMessageDto: CreateMessageDto, conversationId: string, userId: string) {
    return await this.messageService.createMessage(createMessageDto, conversationId, userId);
  }

  async getMessages(conversationId: string, page: number = 1, limit: number = 50) {
    return await this.messageService.getMessages(conversationId, page, limit);
  }

  async deleteMessage(messageId: string, userId: string) {
    return await this.messageService.deleteMessage(messageId, userId);
  }

  async togglePinMessage(messageId: string, userId: string) {
    return await this.messageService.togglePinMessage(messageId, userId);
  }

  async markAsRead(messageId: string, userId: string) {
    return await this.messageService.markAsRead(messageId, userId);
  }

  async markAllAsRead(conversationId: string, userId: string) {
    return await this.messageService.markAllAsRead(conversationId, userId);
  }

  async getUnreadCount(conversationId: string, userId: string) {
    return await this.messageService.getUnreadCount(conversationId, userId);
  }

  // Room methods
  async createRoom(createRoomDto: CreateRoomDto, userId: string) {
    return await this.roomService.createRoom(createRoomDto, userId);
  }

  async getRooms(userId: string) {
    return await this.roomService.getRooms(userId);
  }

  async getRoom(conversationId: string, userId: string) {
    return await this.roomService.getRoom(conversationId, userId);
  }

  async joinRoom(conversationId: string, userId: string) {
    return await this.roomService.joinRoom(conversationId, userId);
  }

  async leaveRoom(conversationId: string, userId: string) {
    return await this.roomService.leaveRoom(conversationId, userId);
  }

  async addMember(conversationId: string, newUserId: string, adminUserId: string) {
    return await this.roomService.addMember(conversationId, newUserId, adminUserId);
  }

  async removeMember(conversationId: string, memberUserId: string, adminUserId: string) {
    return await this.roomService.removeMember(conversationId, memberUserId, adminUserId);
  }

  async getRoomMembers(conversationId: string, userId: string) {
    return await this.roomService.getRoomMembers(conversationId, userId);
  }

  async getBlockedUsers(userId: string) {
    return await this.userChatService.getBlockedUsers(userId);
  }

  // Reaction methods
  async addReaction(messageId: string, userId: string, reaction: string) {
    return await this.reactionService.addReaction(messageId, userId, reaction);
  }

  async removeReaction(messageId: string, userId: string, reaction: string) {
    return await this.reactionService.removeReaction(messageId, userId, reaction);
  }

  async getNotifications() {}

  // User info methods
  async getUser(userId: string) {
    return await this.usersService.findOne(userId);
  }

  async getUsers() {
    return await this.usersService.findAll();
  }
}
