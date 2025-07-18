import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conversation, ConversationDocument } from '@api/modules/chat/chat-room/schema/chat-room.schema';
import { ConversationMember, ConversationMemberDocument } from '@api/modules/chat/chat-room/schema/conversation-member.schema';
import { Message, MessageDocument } from '@api/modules/chat/chat-message/schema/message.schema';
import { MessageStatus, MessageStatusDocument } from '@api/modules/chat/chat-message/schema/message-status.schema';
import { User, UserDocument } from '@api/modules/users/schema/user.schema';
import { CreateMessageDto } from '@api/modules/chat/chat-message/dto/create-message.dto';
import { MessagesResponse, SuccessResponse, FileResponse } from '@api/modules/chat/chat-message/interfaces/response.interface';
import { Express } from 'express';
import { Inject } from '@nestjs/common';
import { REDIS_CLIENT } from '@api/modules/redis';
import type Redis from 'ioredis';
import { UploadService } from '@api/modules/upload/upload.service';

export interface MessageInfo {
  messageId: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: Date;
}

@Injectable()
export class MessageService {
  constructor(
    @InjectModel(Conversation.name)
    private conversationModel: Model<ConversationDocument>,
    @InjectModel(ConversationMember.name)
    private conversationMemberModel: Model<ConversationMemberDocument>,
    @InjectModel(Message.name)
    private messageModel: Model<MessageDocument>,
    @InjectModel(MessageStatus.name)
    private messageStatusModel: Model<MessageStatusDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
    private readonly uploadService: UploadService,
  ) {}

  // Helper: get user by id
  private async getUser(userId: string): Promise<User | null> {
    return this.userModel.findById(userId).exec();
  }

  // Helper: check if user is member of conversation
  private async isMemberOfConversation(userId: string, conversationId: string): Promise<boolean> {
    const userObjectId = new Types.ObjectId(userId);
    const conversationObjectId = new Types.ObjectId(conversationId);
    const member = await this.conversationMemberModel.findOne({
      userId: { $in: [userId, userObjectId] },
      conversationId: { $in: [conversationId, conversationObjectId] },
    });
    return !!member;
  }

  // 1. Gửi tin nhắn mới
  async createMessage(createMessageDto: CreateMessageDto, userId: string, roomId: string): Promise<Message> {
    const message = new this.messageModel({
      ...createMessageDto,
      senderId: new Types.ObjectId(userId),
      conversationId: new Types.ObjectId(roomId),
      createdAt: new Date(),
    });
    const savedMessage = await message.save();
    try {
      const msgObj =
        typeof savedMessage.toObject === 'function'
          ? (savedMessage.toObject() as unknown as { text: string; createdAt: Date; senderId: Types.ObjectId })
          : (savedMessage as unknown as { text: string; createdAt: Date; senderId: Types.ObjectId });
      await this.conversationModel.findByIdAndUpdate(
        roomId,
        {
          $set: {
            lastMessage: {
              content: msgObj.text,
              createdAt: msgObj.createdAt,
              senderId: msgObj.senderId,
            },
          },
        },
        { new: true },
      );
    } catch (err) {
      let errorMsg = 'Không thể cập nhật lastMessage cho room';
      if (err instanceof Error) {
        errorMsg += ': ' + err.message;
      }
      console.error('[MessageService] Lỗi cập nhật lastMessage:', err);
      throw new Error(errorMsg);
    }

    // Tạo bản ghi unread cho các thành viên khác
    try {
      const members = await this.conversationMemberModel
        .find({
          conversationId: new Types.ObjectId(roomId),
        })
        .exec();
      const unreadPromises = members
        .filter((m) => m.userId.toString() !== userId)
        .map((m) =>
          this.messageStatusModel.updateOne(
            {
              messageId: savedMessage._id,
              userId: m.userId,
            },
            {
              isRead: false,
              readAt: null,
            },
            { upsert: true },
          ),
        );
      if (unreadPromises.length > 0) {
        await Promise.all(unreadPromises);
      }
    } catch (err) {
      let errorMsg = 'Không thể tạo unread cho thành viên khác';
      if (err instanceof Error) {
        errorMsg += ': ' + err.message;
      }
      console.error('[MessageService] Lỗi tạo unread:', err);
      throw new Error(errorMsg);
    }
    const populatedMessage = await this.messageModel.findById(savedMessage._id).populate('senderId', 'name avatar email').exec();
    // Nếu sender là admin và là tin nhắn đầu tiên của admin trong phòng, xóa timeout
    const isAdmin = await this.conversationMemberModel.findOne({
      userId: new Types.ObjectId(userId),
      conversationId: new Types.ObjectId(roomId),
      role: 'admin',
    });
    if (isAdmin) {
      const adminMsgCount = await this.messageModel.countDocuments({
        conversationId: new Types.ObjectId(roomId),
        senderId: new Types.ObjectId(userId),
      });
      if (adminMsgCount === 1) {
        await this.redisClient.del(`support:room:${String(roomId)}:waiting_admin`);
      }
    }
    if (!populatedMessage) {
      throw new Error('Message not found');
    }
    return populatedMessage;
  }

  // 2. Lấy danh sách tin nhắn trong phòng
  async getMessages(roomId: string, page: number = 1, limit: number = 50, before?: Date): Promise<MessagesResponse> {
    // Nếu có before timestamp, sử dụng cursor-based pagination
    if (before) {
      const query = {
        conversationId: new Types.ObjectId(roomId),
        isDeleted: false,
        createdAt: { $lt: before },
      };

      // Lấy limit + 1 để kiểm tra có tin nhắn tiếp theo không
      const messages = await this.messageModel
        .find(query)
        .populate('senderId', 'username email avatar')
        .populate('replyTo')
        .sort({ createdAt: -1 })
        .limit(limit + 1)
        .exec();

      // Kiểm tra có tin nhắn tiếp theo không
      const hasMore = messages.length > limit;

      // Nếu có thừa 1 tin nhắn, bỏ đi tin nhắn cuối cùng
      const resultMessages = hasMore ? messages.slice(0, -1) : messages;

      // Lấy timestamp của tin nhắn cuối cùng để làm cursor cho lần query tiếp theo
      const lastMessage = resultMessages[resultMessages.length - 1];
      const beforeCursor = lastMessage ? (lastMessage.toObject() as unknown as { createdAt: Date }).createdAt : undefined;

      return {
        data: resultMessages.reverse(),
        total: resultMessages.length,
        page: 1, // Không áp dụng cho cursor-based
        limit,
        hasNext: hasMore,
        hasPrev: false, // Không áp dụng cho cursor-based
        hasMore,
        before: beforeCursor,
      };
    }

    // Sử dụng page-based pagination (mặc định)
    const skip = (page - 1) * limit;

    const messages = await this.messageModel
      .find({
        conversationId: new Types.ObjectId(roomId),
        isDeleted: false,
      })
      .populate('senderId', 'username email avatar')
      .populate('replyTo')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const total = await this.messageModel
      .countDocuments({
        conversationId: new Types.ObjectId(roomId),
        isDeleted: false,
      })
      .exec();

    return {
      data: messages.reverse(),
      total,
      page,
      limit,
      hasNext: skip + limit < total,
      hasPrev: page > 1,
    };
  }

  // 3. Thu hồi / xóa mềm tin nhắn
  async deleteMessage(messageId: string, userId: string): Promise<Message> {
    const message = await this.messageModel.findById(messageId).exec();
    if (!message) throw new NotFoundException('Message not found');

    if (message.senderId.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    return await message.save();
  }

  // 4. Ghim hoặc bỏ ghim tin nhắn
  async togglePinMessage(messageId: string, userId: string): Promise<Message> {
    const message = await this.messageModel.findById(messageId).exec();
    if (!message) throw new NotFoundException('Message not found');

    const conversation = await this.conversationModel.findById(message.conversationId).exec();
    if (!conversation) throw new NotFoundException('Conversation not found');

    const member = await this.conversationMemberModel
      .findOne({
        userId: new Types.ObjectId(userId),
        conversationId: message.conversationId,
      })
      .exec();

    if (!member || (member.role !== 'admin' && message.senderId.toString() !== userId)) {
      throw new ForbiddenException('You do not have permission to pin this message');
    }

    message.isPinned = !message.isPinned;
    return await message.save();
  }

  // 5. Lấy danh sách user bị mention trong tin nhắn
  async getMessageMentions(messageId: string): Promise<User[]> {
    const message = await this.messageModel.findById(messageId).exec();
    if (!message) throw new NotFoundException('Message not found');

    if (!message.mentions || message.mentions.length === 0) {
      return [];
    }

    const mentionedUsers = await this.userModel
      .find({ _id: { $in: message.mentions } })
      .select('username email avatar')
      .exec();

    return mentionedUsers;
  }

  // 8. Upload file cho tin nhắn
  async uploadFile(messageId: string, file: Express.Multer.File, userId: string): Promise<Message> {
    const message = await this.messageModel.findById(messageId).exec();
    if (!message) throw new NotFoundException('Message not found');
    if (message.senderId.toString() !== userId) throw new ForbiddenException('You can only upload files to your own messages');
    const uploadResult = await this.uploadService.uploadFileToChatFolder(file);

    if (!uploadResult.success || !uploadResult.data) throw new BadRequestException(uploadResult.message || 'Upload failed');
    message.fileUrl = uploadResult.data.savedFile.url;
    return await message.save();
  }

  // 9. Lấy danh sách file đính kèm
  async getMessageFiles(messageId: string): Promise<FileResponse[]> {
    const message = await this.messageModel.findById(messageId).exec();
    if (!message) throw new NotFoundException('Message not found');

    if (!message.fileUrl) return [];

    return [
      {
        url: message.fileUrl,
      },
    ];
  }

  // 21. Đánh dấu tin nhắn là đã đọc
  async markAsRead(messageId: string, userId: string): Promise<SuccessResponse> {
    const message = await this.messageModel.findById(messageId).exec();
    if (!message) throw new NotFoundException('Message not found');

    const isMember = await this.isMemberOfConversation(userId, message.conversationId.toString());
    if (!isMember) throw new ForbiddenException('You are not a member of this conversation');

    // Tạo hoặc cập nhật message status
    await this.messageStatusModel
      .findOneAndUpdate(
        {
          messageId: new Types.ObjectId(messageId),
          userId: new Types.ObjectId(userId),
        },
        {
          isRead: true,
          readAt: new Date(),
        },
        { upsert: true, new: true },
      )
      .exec();

    return { success: true };
  }

  // 22. Đánh dấu tất cả tin nhắn trong phòng là đã đọc
  async markAllAsRead(roomId: string, userId: string): Promise<SuccessResponse> {
    try {
      const isMember = await this.isMemberOfConversation(userId, roomId);
      if (!isMember) {
        return { success: false };
      }

      const unreadMessages = await this.messageModel
        .find({
          conversationId: new Types.ObjectId(roomId),
          isDeleted: false,
        })
        .exec();

      const bulkOps = unreadMessages.map((message) => ({
        updateOne: {
          filter: {
            messageId: message._id,
            userId: new Types.ObjectId(userId),
          },
          update: {
            isRead: true,
            readAt: new Date(),
          },
          upsert: true,
        },
      }));

      if (bulkOps.length > 0) {
        try {
          await this.messageStatusModel.bulkWrite(bulkOps);
        } catch (err) {
          console.error('[markAllAsRead] bulkWrite error:', err);
        }
      }

      return { success: true };
    } catch {
      return { success: false };
    }
  }

  // 23. Lấy số lượng tin nhắn chưa đọc trong phòng
  async getUnreadCount(roomId: string, userId: string): Promise<number> {
    const isMember = await this.isMemberOfConversation(userId, roomId);
    if (!isMember) throw new ForbiddenException('You are not a member of this conversation');

    const totalMessages = await this.messageModel
      .countDocuments({
        conversationId: new Types.ObjectId(roomId),
        isDeleted: false,
      })
      .exec();

    const messages = await this.messageModel
      .find({ conversationId: new Types.ObjectId(roomId), isDeleted: false })
      .select('_id')
      .exec();

    if (messages.length === 0) {
      return 0;
    }

    const readMessages = await this.messageStatusModel
      .countDocuments({
        userId: new Types.ObjectId(userId),
        isRead: true,
        messageId: {
          $in: messages.map((m) => m._id),
        },
      })
      .exec();

    return totalMessages - readMessages;
  }

  async getMessageById(messageId: string): Promise<MessageInfo | null> {
    const message = await this.messageModel.findById(messageId).exec();
    if (!message) return null;

    return {
      messageId: messageId,
      conversationId: message.conversationId.toString(),
      senderId: message.senderId.toString(),
      text: message.text || '',
      createdAt: new Date(),
    };
  }
}
