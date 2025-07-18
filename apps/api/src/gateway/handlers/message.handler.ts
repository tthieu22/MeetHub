import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { WsResponse } from '@api/common/interfaces/ws-response.interface';
import { ChatService } from '../chat.service';
import { UploadService } from '@api/modules/upload/upload.service';
import { GetMessagesDto } from '@api/modules/chat/chat-message/dto/get-messages.dto';
import { CreateMessageDto } from '@api/modules/chat/chat-message/dto/create-message.dto';
import { MarkRoomReadDto } from '@api/modules/chat/chat-message/dto/mark-room-read.dto';
import { GetUnreadCountDto } from '@api/modules/chat/chat-message/dto/get-unread-count.dto';
import { Express } from 'express';
import { Readable } from 'stream';
import { WS_RESPONSE_EVENTS } from '../websocket.events';

@Injectable()
export class MessageHandler {
  constructor(
    private readonly chatService: ChatService,
    private readonly uploadService: UploadService,
  ) {}

  // Lấy tin nhắn của phòng, kiểm tra quyền truy cập
  async handleGetMessages(userId: string, dto: GetMessagesDto): Promise<WsResponse> {
    const isMember = await this.chatService.validateRoomMembership(userId, dto.roomId);
    if (!isMember) {
      return { success: false, message: 'Bạn không phải member của room này', code: 'NOT_MEMBER' };
    }
    const before = dto.before ? new Date(dto.before) : undefined;
    const messages = await this.chatService.getMessages(dto.roomId, 1, dto.limit || 20, before);
    return { success: true, data: { roomId: dto.roomId, ...messages } };
  }

  // Xử lý gửi tin nhắn mới (có thể kèm file), emit tới các thành viên phòng
  async handleCreateMessage(server: Server, userId: string, dto: CreateMessageDto & { roomId: string }): Promise<WsResponse> {
    const isMember = await this.chatService.validateRoomMembership(userId, dto.roomId);
    if (!isMember) {
      return { success: false, message: 'Bạn không phải member của room này', code: 'NOT_MEMBER' };
    }
    if (dto.fileData) {
      const buffer = Buffer.from(dto.fileData, 'base64');
      const fakeFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: dto.fileName || 'upload.bin',
        encoding: '7bit',
        mimetype: dto.fileType || 'application/octet-stream',
        size: buffer.length,
        buffer,
        destination: '',
        filename: '',
        path: '',
        stream: Readable.from([]),
      };
      const uploadResult = await this.uploadService.uploadFileToChatFolder(fakeFile);
      if (uploadResult.success && uploadResult.data) {
        dto.fileUrl = uploadResult.data.savedFile.url;
      }
      delete dto.fileData;
    }
    const message = await this.chatService.createMessage(dto, dto.roomId, userId);
    // Đánh dấu đã đọc cho người gửi
    await this.chatService.markAllAsRead(dto.roomId, userId);
    const response: WsResponse = { success: true, data: message };

    if (response.success) {
      server.to(`room:${dto.roomId}`).emit(WS_RESPONSE_EVENTS.NEW_MESSAGE, response);
      const roomMembers: { userId: { _id: any } }[] = await this.chatService.getRoomMembers(dto.roomId, userId);
      await Promise.all(
        roomMembers.map(async (member) => {
          const memberId: string = String(member.userId._id);
          const unreadCount = await this.chatService.getUnreadCount(dto.roomId, memberId);
          const unreadResponse: WsResponse = {
            success: true,
            data: { roomId: dto.roomId, unreadCount },
          };
          server.to(`user:${memberId}`).emit(WS_RESPONSE_EVENTS.UNREAD_COUNT_UPDATED, unreadResponse);
        }),
      );
    }
    return response;
  }

  // Đánh dấu đã đọc toàn bộ tin nhắn trong phòng, emit tới các thành viên
  async handleMarkRoomRead(server: Server, userId: string, dto: MarkRoomReadDto): Promise<WsResponse> {
    const isMember = await this.chatService.validateRoomMembership(userId, dto.roomId);
    if (!isMember) {
      return { success: false, message: 'Bạn không phải member của room này', code: 'NOT_MEMBER' };
    }
    await this.chatService.markAllAsRead(dto.roomId, userId);
    const response: WsResponse = { success: true, message: 'Đã đánh dấu đọc thành công', data: { roomId: dto.roomId, userId, markedAt: new Date() } };

    if (response.success) {
      server.to(`room:${dto.roomId}`).emit(WS_RESPONSE_EVENTS.ROOM_MARKED_READ, response);
    }
    return response;
  }

  // Lấy số lượng tin nhắn chưa đọc của user trong phòng
  async handleGetUnreadCount(userId: string, dto: GetUnreadCountDto): Promise<WsResponse> {
    const isMember = await this.chatService.validateRoomMembership(userId, dto.roomId);
    if (!isMember) {
      return { success: false, message: 'Bạn không phải member của room này', code: 'NOT_MEMBER' };
    }
    const unreadCount = await this.chatService.getUnreadCount(dto.roomId, userId);
    return { success: true, data: { roomId: dto.roomId, unreadCount } };
  }
}
