import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conversation, ConversationDocument } from '@api/modules/chat-room/schema/chat-room.schema';
import { ConversationMember, ConversationMemberDocument } from '@api/modules/chat-room/schema/conversation-member.schema';
import { Message, MessageDocument } from '@api/modules/chat-message/schema/message.schema';
import { MessageStatus, MessageStatusDocument } from '@api/modules/chat-message/schema/message-status.schema';
import { User, UserDocument } from '@api/modules/users/schema/user.schema';
import { CreateMessageDto } from './dto/create-message.dto';

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
  ) {}

  // Helper: get user by id
  private async getUser(userId: string): Promise<User | null> {
    return this.userModel.findById(userId);
  }

  // Helper: check if user is member of conversation
  private async isMemberOfConversation(userId: string, conversationId: string): Promise<boolean> {
    const member = await this.conversationMemberModel.findOne({
      userId: new Types.ObjectId(userId),
      conversationId: new Types.ObjectId(conversationId),
    });
    return !!member;
  }

  // 1. Gửi tin nhắn mới
  async createMessage(createMessageDto: CreateMessageDto, userId: string, conversationId: string) {
    const user = await this.getUser(userId);
    if (!user) throw new NotFoundException('User not found');

    const conversation = await this.conversationModel.findById(conversationId);
    if (!conversation) throw new NotFoundException('Conversation not found');

    const isMember = await this.isMemberOfConversation(userId, conversationId);
    if (!isMember) throw new ForbiddenException('You are not a member of this conversation');

    const { text, fileUrl, replyTo, mentions = [] } = createMessageDto;

    const message = new this.messageModel({
      conversationId: new Types.ObjectId(conversationId),
      senderId: new Types.ObjectId(userId),
      text: text || '',
      fileUrl,
      replyTo: replyTo ? new Types.ObjectId(replyTo) : undefined,
      mentions: mentions.map((id) => new Types.ObjectId(id)),
      isPinned: false,
      isDeleted: false,
    });

    const savedMessage = await message.save();
    await savedMessage.populate('senderId', 'username email avatar');

    return savedMessage;
  }

  // 2. Lấy danh sách tin nhắn trong phòng
  async getMessages(conversationId: string, page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const messages = await this.messageModel
      .find({
        conversationId: new Types.ObjectId(conversationId),
        isDeleted: false,
      })
      .populate('senderId', 'username email avatar')
      .populate('replyTo')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const total = await this.messageModel.countDocuments({
      conversationId: new Types.ObjectId(conversationId),
      isDeleted: false,
    });

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
  async deleteMessage(messageId: string, userId: string) {
    const message = await this.messageModel.findById(messageId);
    if (!message) throw new NotFoundException('Message not found');

    if (message.senderId.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    return await message.save();
  }

  // 4. Ghim hoặc bỏ ghim tin nhắn
  async togglePinMessage(messageId: string, userId: string) {
    const message = await this.messageModel.findById(messageId);
    if (!message) throw new NotFoundException('Message not found');

    const conversation = await this.conversationModel.findById(message.conversationId);
    if (!conversation) throw new NotFoundException('Conversation not found');

    const member = await this.conversationMemberModel.findOne({
      userId: new Types.ObjectId(userId),
      conversationId: message.conversationId,
    });

    if (!member || (member.role !== 'admin' && message.senderId.toString() !== userId)) {
      throw new ForbiddenException('You do not have permission to pin this message');
    }

    message.isPinned = !message.isPinned;
    return await message.save();
  }

  // 5. Lấy danh sách user bị mention trong tin nhắn
  async getMessageMentions(messageId: string) {
    const message = await this.messageModel.findById(messageId);
    if (!message) throw new NotFoundException('Message not found');

    const mentionedUsers = await this.userModel.find({ _id: { $in: message.mentions } }).select('username email avatar');

    return mentionedUsers;
  }

  // 8. Upload file cho tin nhắn
  async uploadFile(messageId: string, file: any, userId: string) {
    const message = await this.messageModel.findById(messageId);
    if (!message) throw new NotFoundException('Message not found');

    if (message.senderId.toString() !== userId) {
      throw new ForbiddenException('You can only upload files to your own messages');
    }

    message.fileUrl = file.path as string;
    return await message.save();
  }

  // 9. Lấy danh sách file đính kèm
  async getMessageFiles(messageId: string) {
    const message = await this.messageModel.findById(messageId);
    if (!message) throw new NotFoundException('Message not found');

    if (!message.fileUrl) return [];

    return [
      {
        url: message.fileUrl,
        // Có thể thêm thông tin khác về file
      },
    ];
  }

  // 21. Đánh dấu tin nhắn là đã đọc
  async markAsRead(messageId: string, userId: string) {
    const message = await this.messageModel.findById(messageId);
    if (!message) throw new NotFoundException('Message not found');

    const isMember = await this.isMemberOfConversation(userId, message.conversationId.toString());
    if (!isMember) throw new ForbiddenException('You are not a member of this conversation');

    // Tạo hoặc cập nhật message status
    await this.messageStatusModel.findOneAndUpdate(
      {
        messageId: new Types.ObjectId(messageId),
        userId: new Types.ObjectId(userId),
      },
      {
        isRead: true,
        readAt: new Date(),
      },
      { upsert: true, new: true },
    );

    return { success: true };
  }

  // 22. Đánh dấu tất cả tin nhắn trong phòng là đã đọc
  async markAllAsRead(conversationId: string, userId: string) {
    const isMember = await this.isMemberOfConversation(userId, conversationId);
    if (!isMember) throw new ForbiddenException('You are not a member of this conversation');

    const unreadMessages = await this.messageModel.find({
      conversationId: new Types.ObjectId(conversationId),
      isDeleted: false,
    });

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
      await this.messageStatusModel.bulkWrite(bulkOps);
    }

    return { success: true };
  }

  // 23. Lấy số lượng tin nhắn chưa đọc trong phòng
  async getUnreadCount(conversationId: string, userId: string) {
    const isMember = await this.isMemberOfConversation(userId, conversationId);
    if (!isMember) throw new ForbiddenException('You are not a member of this conversation');

    const totalMessages = await this.messageModel.countDocuments({
      conversationId: new Types.ObjectId(conversationId),
      isDeleted: false,
    });

    const readMessages = await this.messageStatusModel.countDocuments({
      userId: new Types.ObjectId(userId),
      isRead: true,
      messageId: {
        $in: await this.messageModel
          .find({ conversationId: new Types.ObjectId(conversationId), isDeleted: false })
          .select('_id')
          .then((messages) => messages.map((m) => m._id)),
      },
    });

    return totalMessages - readMessages;
  }
}
