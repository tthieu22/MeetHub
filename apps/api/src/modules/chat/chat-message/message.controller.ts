import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, UseInterceptors, BadRequestException, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MessageService } from '@api/modules/chat/chat-message/message.service';
import { AuthGuard } from '@api/auth/auth.guard';
import { CreateMessageDto } from '@api/modules/chat/chat-message/dto/create-message.dto';
import { GetMessagesDto } from '@api/modules/chat/chat-message/dto/get-messages.dto';
import { DeleteMessageDto } from '@api/modules/chat/chat-message/dto/delete-message.dto';
import { MarkReadDto } from '@api/modules/chat/chat-message/dto/mark-read.dto';
import { Express } from 'express';
import { UploadService } from '@api/modules/upload/upload.service';
import { Readable } from 'stream';

@Controller('messages')
@UseGuards(AuthGuard)
export class MessageController {
  constructor(
    private readonly messageService: MessageService,
    private readonly uploadService: UploadService,
  ) {}

  // 1. Gửi tin nhắn mới
  @Post()
  async createMessage(@Body() createMessageDto: CreateMessageDto, @Query('userId') userId: string, @Query('roomId') roomId: string) {
    // Nếu có fileData (base64), fileName, fileType thì xử lý upload như handler
    if (createMessageDto.fileData) {
      const buffer = Buffer.from(createMessageDto.fileData, 'base64');
      const fakeFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: createMessageDto.fileName || 'upload.bin',
        encoding: '7bit',
        mimetype: createMessageDto.fileType || 'application/octet-stream',
        size: buffer.length,
        buffer,
        destination: '',
        filename: '',
        path: '',
        stream: Readable.from([]),
      };
      const uploadResult = await this.uploadService.uploadFileToChatFolder(fakeFile);
      if (uploadResult.success && uploadResult.data) {
        createMessageDto.fileUrl = uploadResult.data.savedFile.url;
      }
      delete createMessageDto.fileData;
    }
    const message = await this.messageService.createMessage(createMessageDto, userId, roomId);
    return { success: true, data: message };
  }

  // 2. Lấy danh sách tin nhắn trong phòng
  @Get()
  async getMessages(@Query() getMessagesDto: GetMessagesDto) {
    const before = getMessagesDto.before ? new Date(getMessagesDto.before) : undefined;
    return this.messageService.getMessages(getMessagesDto.roomId, getMessagesDto.page, getMessagesDto.limit, before);
  }

  // 3. Thu hồi / xóa mềm tin nhắn
  @Delete(':id')
  async deleteMessage(@Param('id') id: string, @Query('userId') userId: string) {
    const deleteMessageDto: DeleteMessageDto = { id, userId };
    return this.messageService.deleteMessage(deleteMessageDto.id, deleteMessageDto.userId);
  }

  // 4. Ghim hoặc bỏ ghim tin nhắn
  @Put(':id/pin')
  async togglePinMessage(@Param('id') id: string, @Query('userId') userId: string) {
    return this.messageService.togglePinMessage(id, userId);
  }

  // 5. Lấy danh sách user bị mention trong tin nhắn
  @Get(':id/mentions')
  async getMessageMentions(@Param('id') id: string) {
    return this.messageService.getMessageMentions(id);
  }

  // 8. Upload file cho tin nhắn

  @Post(':id/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@Param('id') id: string, @UploadedFile() file: Express.Multer.File, @Query('userId') userId: string) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return await this.messageService.uploadFile(id, file, userId);
  }
  // 9. Lấy danh sách file đính kèm
  @Get(':id/files')
  async getMessageFiles(@Param('id') id: string) {
    return this.messageService.getMessageFiles(id);
  }

  // 21. Đánh dấu tin nhắn là đã đọc
  @Put(':id/read')
  async markAsRead(@Param('id') id: string, @Query('userId') userId: string) {
    const markReadDto: MarkReadDto = { id, userId };
    return this.messageService.markAsRead(markReadDto.id, markReadDto.userId);
  }

  // 22. Đánh dấu tất cả tin nhắn trong phòng là đã đọc
  @Put('room/:roomId/read-all')
  async markAllAsRead(@Param('roomId') roomId: string, @Query('userId') userId: string) {
    return this.messageService.markAllAsRead(roomId, userId);
  }

  // 23. Lấy số lượng tin nhắn chưa đọc
  @Get('room/:roomId/unread-count')
  async getUnreadCount(@Param('roomId') roomId: string, @Query('userId') userId: string) {
    return this.messageService.getUnreadCount(roomId, userId);
  }
}
