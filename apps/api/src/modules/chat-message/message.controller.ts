import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MessageService } from '@api/modules/chat-message/message.service';
import { CreateMessageDto } from '@api/modules/chat-message/dto/create-message.dto';

@Controller('messages')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  // 1. Gửi tin nhắn mới
  @Post()
  async createMessage(@Body() createMessageDto: CreateMessageDto, @Query('userId') userId: string, @Query('conversationId') conversationId: string) {
    return await this.messageService.createMessage(createMessageDto, userId, conversationId);
  }

  // 2. Lấy danh sách tin nhắn trong phòng
  @Get()
  async getMessages(@Query('roomId') roomId: string, @Query('page') page: number = 1, @Query('limit') limit: number = 50) {
    return this.messageService.getMessages(roomId, page, limit);
  }

  // 3. Thu hồi / xóa mềm tin nhắn
  @Delete(':id')
  async deleteMessage(@Param('id') id: string, @Query('userId') userId: string) {
    return this.messageService.deleteMessage(id, userId);
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
  async uploadFile(@Param('id') id: string, @UploadedFile() file: any, @Query('userId') userId: string) {
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
    return this.messageService.markAsRead(id, userId);
  }
}
