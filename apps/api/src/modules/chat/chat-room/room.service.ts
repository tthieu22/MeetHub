import { Injectable, NotFoundException, ForbiddenException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conversation, ConversationDocument } from '@api/modules/chat/chat-room/schema/chat-room.schema';
import { ConversationMember, ConversationMemberDocument } from '@api/modules/chat/chat-room/schema/conversation-member.schema';
import { Message, MessageDocument } from '@api/modules/chat/chat-message/schema/message.schema';
import { MessageStatus, MessageStatusDocument } from '@api/modules/chat/chat-message/schema/message-status.schema';
import { User, UserDocument } from '@api/modules/users/schema/user.schema';
import { CreateRoomDto, UpdateRoomDto } from '@api/modules/chat/chat-room/dto';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from '@api/modules/redis';
import { RoomInfo, RoomMemberInfo, LastMessageInfo, RoomSidebarInfo, PopulatedUser } from '@api/modules/chat/chat-room/interfaces/room-sidebar.interface';

@Injectable()
export class RoomService {
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
  ) {}

  private async isMemberOfConversation(userId: string, conversationId: string): Promise<boolean> {
    try {
      if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(conversationId)) {
        return false;
      }

      const member = await this.conversationMemberModel.findOne({
        userId: new Types.ObjectId(userId),
        conversationId: new Types.ObjectId(conversationId),
      });
      return !!member;
    } catch {
      return false;
    }
  }

  // Helper: check if user is admin of conversation
  private async isAdminOfConversation(userId: string, conversationId: string): Promise<boolean> {
    try {
      if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(conversationId)) {
        return false;
      }

      const member = await this.conversationMemberModel.findOne({
        userId: new Types.ObjectId(userId),
        conversationId: new Types.ObjectId(conversationId),
        role: 'admin',
      });
      return !!member;
    } catch {
      return false;
    }
  }

  // 10. Tạo phòng mới (1-1 hoặc group)
  async createRoom(createRoomDto: CreateRoomDto, userId: string) {
    const { name, type, members = [] } = createRoomDto;
    members.forEach((m, idx) => console.log(`Tạo phòng - member[${idx}]:`, m, typeof m));

    const conversation = new this.conversationModel({
      name,
      type,
      creatorId: new Types.ObjectId(userId),
      isDeleted: false,
    });

    const savedConversation = await conversation.save();

    // Thêm creator làm admin
    await this.conversationMemberModel.create({
      userId: new Types.ObjectId(userId),
      conversationId: savedConversation._id,
      role: 'admin',
    });

    // Thêm các thành viên khác
    if (members.length > 0) {
      const memberDocs = members.map((memberId) => ({
        userId: new Types.ObjectId(memberId),
        conversationId: savedConversation._id,
        role: 'member',
      }));
      await this.conversationMemberModel.insertMany(memberDocs);
    }

    return savedConversation;
  }

  // 11. Danh sách phòng của user
  async getRooms(userId: string): Promise<RoomInfo[]> {
    try {
      if (!userId || userId === 'mock-user-id') {
        return [];
      }
      const memberConversations = await this.conversationMemberModel
        .find({ userId: new Types.ObjectId(userId) })
        .select('conversationId')
        .exec();
      const conversationIds = memberConversations.map((mc) => mc.conversationId);
      if (conversationIds.length === 0) {
        return [];
      }
      const conversations = await this.conversationModel
        .find({
          _id: { $in: conversationIds },
          isDeleted: false,
        })
        .exec();
      return conversations.map((conv) => ({
        roomId: String(conv._id),
        name: conv.name,
        type: conv.type,
      }));
    } catch (error) {
      console.error('Error in getRooms:', error);
      throw error;
    }
  }

  // 12. Thông tin chi tiết 1 phòng
  async getRoom(conversationId: string, userId: string) {
    try {
      // Kiểm tra ObjectId hợp lệ
      if (!Types.ObjectId.isValid(conversationId)) {
        throw new NotFoundException('Invalid conversation ID format');
      }

      const isMember = await this.isMemberOfConversation(userId, conversationId);
      if (!isMember) throw new ForbiddenException('You are not a member of this conversation');

      const conversation = await this.conversationModel.findById(conversationId);
      if (!conversation) throw new NotFoundException('Conversation not found');

      return conversation;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new NotFoundException('Conversation not found');
    }
  }

  // 13. Cập nhật tên, mô tả phòng
  async updateRoom(conversationId: string, updateRoomDto: UpdateRoomDto, userId: string) {
    const isAdmin = await this.isAdminOfConversation(userId, conversationId);
    if (!isAdmin) throw new ForbiddenException('Only admins can update conversation');

    const conversation = await this.conversationModel.findByIdAndUpdate(conversationId, updateRoomDto, { new: true });

    if (!conversation) throw new NotFoundException('Conversation not found');

    return conversation;
  }

  // 14. Xóa phòng chat (admin)
  async deleteRoom(conversationId: string, userId: string) {
    const isAdmin = await this.isAdminOfConversation(userId, conversationId);
    if (!isAdmin) throw new ForbiddenException('Only admins can delete conversation');

    const conversation = await this.conversationModel.findByIdAndUpdate(
      conversationId,
      {
        isDeleted: true,
        deletedAt: new Date(),
      },
      { new: true },
    );

    if (!conversation) throw new NotFoundException('Conversation not found');

    return conversation;
  }

  // 15. Tham gia phòng chat (group)
  async joinRoom(conversationId: string, userId: string) {
    const conversation = await this.conversationModel.findById(conversationId);
    if (!conversation) throw new NotFoundException('Conversation not found');

    if (conversation.type !== 'group') {
      throw new ForbiddenException('Only group conversations can be joined');
    }

    const existingMember = await this.conversationMemberModel.findOne({
      userId: new Types.ObjectId(userId),
      conversationId: new Types.ObjectId(conversationId),
    });

    if (existingMember) {
      throw new ForbiddenException('You are already a member of this conversation');
    }

    await this.conversationMemberModel.create({
      userId: new Types.ObjectId(userId),
      conversationId: new Types.ObjectId(conversationId),
      role: 'member',
    });

    return { success: true };
  }

  // 16. Rời khỏi phòng chat
  async leaveRoom(conversationId: string, userId: string) {
    const member = await this.conversationMemberModel.findOne({
      userId: new Types.ObjectId(userId),
      conversationId: new Types.ObjectId(conversationId),
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this conversation');
    }

    await this.conversationMemberModel.findByIdAndDelete(member._id);

    return { success: true };
  }

  // 17. Thêm user vào group chat
  async addMember(conversationId: string, newUserId: string, adminUserId: string) {
    const isAdmin = await this.isAdminOfConversation(adminUserId, conversationId);
    if (!isAdmin) throw new ForbiddenException('Only admins can add members');

    const conversation = await this.conversationModel.findById(conversationId);
    if (!conversation) throw new NotFoundException('Conversation not found');

    if (conversation.type !== 'group') {
      throw new ForbiddenException('Only group conversations can have multiple members');
    }

    const existingMember = await this.conversationMemberModel.findOne({
      userId: new Types.ObjectId(newUserId),
      conversationId: new Types.ObjectId(conversationId),
    });

    if (existingMember) {
      throw new ForbiddenException('User is already a member of this conversation');
    }

    await this.conversationMemberModel.create({
      userId: new Types.ObjectId(newUserId),
      conversationId: new Types.ObjectId(conversationId),
      role: 'member',
    });

    return { success: true };
  }

  // 18. Xoá người ra khỏi phòng
  async removeMember(conversationId: string, memberUserId: string, adminUserId: string) {
    const isAdmin = await this.isAdminOfConversation(adminUserId, conversationId);
    if (!isAdmin) throw new ForbiddenException('Only admins can remove members');

    const member = await this.conversationMemberModel.findOne({
      userId: new Types.ObjectId(memberUserId),
      conversationId: new Types.ObjectId(conversationId),
    });

    if (!member) {
      throw new NotFoundException('Member not found in this conversation');
    }

    await this.conversationMemberModel.findByIdAndDelete(member._id);

    return { success: true };
  }

  // 19. Lấy danh sách user trong phòng
  async getRoomMembers(conversationId: string, userId: string) {
    const isMember = await this.isMemberOfConversation(userId, conversationId);
    if (!isMember) throw new ForbiddenException('You are not a member of this conversation');

    const members = await this.conversationMemberModel
      .find({ conversationId: new Types.ObjectId(conversationId) })
      .populate('userId', 'username email avatar')
      .exec();

    return members;
  }

  // 22. Đánh dấu toàn bộ tin nhắn trong phòng là đã đọc
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

  async getLastMessage(roomId: string): Promise<LastMessageInfo | null> {
    const msg = await this.messageModel
      .findOne({ conversationId: new Types.ObjectId(roomId), isDeleted: false })
      .sort({ createdAt: -1 })
      .lean();
    if (!msg) return null;
    const getIdString = (id: unknown) => (typeof id === 'object' && id && 'toString' in id ? (id as { toString(): string }).toString() : String(id));
    return {
      messageId: getIdString(msg._id),
      conversationId: getIdString(msg.conversationId),
      senderId: getIdString(msg.senderId),
      text: msg.text,
      createdAt: (msg as { createdAt?: Date | string }).createdAt ? new Date((msg as { createdAt?: Date | string }).createdAt!) : new Date(0),
    };
  }
  async getUnreadCount(roomId: string, userId: string): Promise<number> {
    const isMember = await this.isMemberOfConversation(userId, roomId);
    if (!isMember) throw new ForbiddenException('You are not a member of this conversation');
    const totalMessages = await this.messageModel.countDocuments({
      conversationId: new Types.ObjectId(roomId),
      isDeleted: false,
    });
    const readMessages = await this.messageStatusModel.countDocuments({
      userId: new Types.ObjectId(userId),
      isRead: true,
      messageId: {
        $in: await this.messageModel
          .find({ conversationId: new Types.ObjectId(roomId), isDeleted: false })
          .select('_id')
          .then((messages) => messages.map((m) => m._id)),
      },
    });
    return totalMessages - readMessages;
  }

  async getOnlineMemberIds(roomId: string): Promise<string[]> {
    // Đảm bảo roomId là ObjectId khi truy vấn
    const members = await this.conversationMemberModel
      .find({ conversationId: new Types.ObjectId(roomId) })
      .select('userId')
      .lean();
    const userIds = members.map((m) => String(m.userId));
    const onlineChecks = await Promise.all(userIds.map((uid) => this.redisClient.get(`user:online:${uid}`)));
    return [...new Set(userIds.filter((uid, idx) => onlineChecks[idx] === '1'))];
  }

  async getRoomSidebarInfo(userId: string): Promise<RoomSidebarInfo[]> {
    const rooms = await this.getRooms(userId);
    const result: RoomSidebarInfo[] = [];
    for (const room of rooms) {
      const membersRaw = await this.conversationMemberModel
        .find({ conversationId: new Types.ObjectId(room.roomId) })
        .populate('userId', 'name avatarURL')
        .lean();

      const members: RoomMemberInfo[] = membersRaw.map((m) => {
        const u = m.userId as PopulatedUser;
        return {
          userId: u._id.toString(),
          name: u.name || '',
          avatarURL: u.avatarURL,
        };
      });

      const lastMessage = await this.getLastMessage(room.roomId);
      const unreadCount = await this.getUnreadCount(room.roomId, userId);
      const onlineMemberIds = await this.getOnlineMemberIds(room.roomId);
      result.push({
        roomId: room.roomId,
        name: room.name,
        isGroup: room.type === 'group',
        members,
        lastMessage,
        unreadCount,
        onlineMemberIds,
      });
    }
    return result;
  }
}
