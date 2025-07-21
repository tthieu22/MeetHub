import { Injectable, NotFoundException, ForbiddenException, Inject, BadRequestException, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { Conversation, ConversationDocument } from '@api/modules/chat/chat-room/schema/chat-room.schema';
import { ConversationMember, ConversationMemberDocument } from '@api/modules/chat/chat-room/schema/conversation-member.schema';
import { Message, MessageDocument } from '@api/modules/chat/chat-message/schema/message.schema';
import { MessageStatus, MessageStatusDocument } from '@api/modules/chat/chat-message/schema/message-status.schema';
import { User, UserDocument } from '@api/modules/users/schema/user.schema';
import { CreateRoomDto, UpdateRoomDto } from '@api/modules/chat/chat-room/dto';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from '@api/modules/redis';
import { RoomInfo, RoomMemberInfo, LastMessageInfo, RoomSidebarInfo, PopulatedUser, RoomDetailInfo } from '@api/modules/chat/chat-room/interfaces/room-sidebar.interface';
import { PaginationQueryDto } from '@api/modules/users/dto/pagination-query.dto';
import { ReactionService } from '@api/modules/chat/chat-reactions/reaction.service';
import { ChatGateway } from '@api/gateway/chat.gateway';

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
    private readonly reactionService: ReactionService,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
  ) {}

  private async isMemberOfConversation(userId: string, conversationId: string): Promise<boolean> {
    try {
      if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(conversationId)) {
        return false;
      }
      const userObjectId = new Types.ObjectId(userId);
      const member = await this.conversationMemberModel.findOne({
        userId: { $in: [userId, userObjectId] },
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
      const userObjectId = new Types.ObjectId(userId);
      const member = await this.conversationMemberModel.findOne({
        userId: { $in: [userId, userObjectId] },
        conversationId: new Types.ObjectId(conversationId),
        role: 'admin',
      });
      return !!member;
    } catch {
      return false;
    }
  }

  async createRoom(createRoomDto: CreateRoomDto, userId: string) {
    const { name, type, members = [] } = createRoomDto;
    // Validate members
    if (!members || members.length === 0) {
      throw new BadRequestException('Members are required');
    }

    // Đảm bảo tất cả thành viên (bao gồm cả người tạo) không bị trùng lặp
    const allMembers = Array.from(new Set(members.concat(userId)));

    // Validate all members exist
    const existingUsers = await this.userModel
      .find({
        _id: { $in: allMembers },
      })
      .exec();

    if (existingUsers.length !== allMembers.length) {
      throw new BadRequestException('Some members do not exist');
    }

    // Create room
    const conversation = new this.conversationModel({
      name,
      type,
      creatorId: userId,
      memberIds: allMembers,
      currentAdminId: type === 'group' ? userId : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const savedConversation = await conversation.save();
    const memberPromises = allMembers.map((memberId) =>
      new this.conversationMemberModel({
        conversationId: savedConversation._id,
        userId: memberId,
        role: memberId === userId ? 'admin' : 'member',
        joinedAt: new Date(),
      }).save(),
    );
    await Promise.all(memberPromises);

    for (const memberId of allMembers) {
      await this.chatGateway.handleGetRoomsForUser(memberId);
    }

    return savedConversation;
  }

  // 11. Danh sách phòng của user
  async getRooms(userId: string): Promise<RoomInfo[]> {
    try {
      if (!userId || userId === 'mock-user-id') {
        return [];
      }
      const userObjectId = new Types.ObjectId(userId);
      // Lấy tất cả conversationId mà user là thành viên (ConversationMember), match cả string và ObjectId
      const memberConversations = await this.conversationMemberModel
        .find({ userId: { $in: [userId, userObjectId] } })
        .select('conversationId')
        .lean();
      const conversationIds = memberConversations.map((mc) => mc.conversationId);

      // Lấy tất cả phòng mà user là thành viên thực sự
      const conversations = await this.conversationModel
        .find({
          isDeleted: false,
          _id: { $in: conversationIds },
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
  async getRoom(conversationId: string, userId: string): Promise<RoomDetailInfo> {
    try {
      // Kiểm tra ObjectId hợp lệ
      if (!Types.ObjectId.isValid(conversationId)) {
        throw new NotFoundException('Invalid conversation ID format');
      }

      // Kiểm tra thành viên với cả string và ObjectId
      const userObjectId = new Types.ObjectId(userId);
      const isMember = await this.conversationMemberModel.findOne({
        userId: { $in: [userId, userObjectId] },
        conversationId: new Types.ObjectId(conversationId),
      });
      if (!isMember) throw new ForbiddenException('You are not a member of this conversation');

      // Lấy thông tin conversation
      const conversation = await this.conversationModel.findById(conversationId);
      if (!conversation) throw new NotFoundException('Conversation not found');

      // Lấy danh sách thành viên với thông tin chi tiết
      const members = await this.conversationMemberModel
        .find({ conversationId: new Types.ObjectId(conversationId) })
        .populate('userId', 'name email avatarURL')
        .exec();

      // Lấy thông tin creator
      const creator = await this.userModel.findById(conversation.creatorId).select('name email avatarURL').exec();

      const conversationObj = conversation.toObject();

      return {
        ...conversationObj,
        members: members.map((member) => {
          const user = member.userId as unknown as { _id: Types.ObjectId; name: string; email: string; avatarURL?: string };
          const memberObj = member as unknown as { createdAt: Date };
          return {
            userId: user._id.toString(),
            name: user.name,
            email: user.email,
            avatar: user.avatarURL,
            role: member.role,
            joinedAt: memberObj.createdAt,
          };
        }),
        creator: creator
          ? {
              userId: creator._id.toString(),
              name: creator.name,
              email: creator.email,
              avatar: creator.avatarURL,
            }
          : null,
      } as unknown as RoomDetailInfo;
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

    // Xoá member
    await this.conversationMemberModel.deleteMany({ conversationId });

    // Lấy tất cả message thuộc phòng
    const messages = await this.messageModel.find({ conversationId: new Types.ObjectId(conversationId) }).select('_id');
    const messageIds = messages.map((m) => m._id);

    // Xoá reaction liên quan
    if (messageIds.length > 0) {
      await this.reactionService['reactionModel'].deleteMany({ messageId: { $in: messageIds } });
    }

    // Xoá message
    await this.messageModel.deleteMany({ conversationId });

    // Xoá message status
    await this.messageStatusModel.deleteMany({ conversationId });

    // Xoá hoàn toàn phòng khỏi database
    const conversation = await this.conversationModel.findByIdAndDelete(conversationId);
    if (!conversation) throw new NotFoundException('Conversation not found');

    return { success: true, message: 'Room deleted successfully' };
  }

  // 15. Tham gia phòng chat (group)
  async joinRoom(conversationId: string, userId: string) {
    const conversation = await this.conversationModel.findById(conversationId);
    if (!conversation) throw new NotFoundException('Conversation not found');

    if (conversation.type !== 'group') {
      throw new ForbiddenException('Only group conversations can be joined');
    }

    const userObjectId = new Types.ObjectId(userId);
    const existingMember = await this.conversationMemberModel.findOne({
      userId: { $in: [userId, userObjectId] },
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
    const userObjectId = new Types.ObjectId(userId);
    const member = await this.conversationMemberModel.findOne({
      userId: { $in: [userId, userObjectId] },
      conversationId: new Types.ObjectId(conversationId),
    });
    if (!member) {
      throw new ForbiddenException('You are not a member of this conversation');
    }

    await this.conversationMemberModel.findByIdAndDelete(member._id);

    return { success: true };
  }

  // 17. Thêm user vào group chat
  async addMember(conversationId: string, newUserId: string) {
    // const isAdmin = await this.isAdminOfConversation(adminUserId, conversationId);
    // if (!isAdmin) throw new ForbiddenException('Only admins can add members');

    const conversation = await this.conversationModel.findById(conversationId);
    if (!conversation) throw new NotFoundException('Conversation not found');

    if (conversation.type !== 'group') {
      throw new ForbiddenException('Only group conversations can have multiple members');
    }

    const newUserObjectId = new Types.ObjectId(newUserId);
    const existingMember = await this.conversationMemberModel.findOne({
      userId: { $in: [newUserId, newUserObjectId] },
      conversationId: new Types.ObjectId(conversationId),
    });

    if (existingMember) {
      throw new ForbiddenException('User is already a member of this conversation');
    }

    try {
      await this.conversationMemberModel.create({
        userId: new Types.ObjectId(newUserId),
        conversationId: new Types.ObjectId(conversationId),
        role: 'member',
      });
    } catch (error) {
      throw error;
    }

    return { success: true };
  }

  // 18. Xoá người ra khỏi phòng
  async removeMember(conversationId: string, memberUserId: string, adminUserId: string) {
    const isAdmin = await this.isAdminOfConversation(adminUserId, conversationId);
    if (!isAdmin) throw new ForbiddenException('Only admins can remove members');

    const memberUserObjectId = new Types.ObjectId(memberUserId);
    const member = await this.conversationMemberModel.findOne({
      userId: { $in: [memberUserId, memberUserObjectId] },
      conversationId: new Types.ObjectId(conversationId),
    });

    if (!member) {
      throw new NotFoundException('Member not found in this conversation');
    }

    await this.conversationMemberModel.findByIdAndDelete(member._id);

    return { success: true };
  }

  async removeMembers(roomId: string, userIds: string[], currentUserId: string) {
    await Promise.all(userIds.map((userId) => this.removeMember(roomId, userId, currentUserId)));
    return { success: true, removed: userIds.length };
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

  // Lấy tin nhắn cuối cùng của phòng
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
      text: msg.text || '',
      createdAt: (msg as { createdAt?: Date | string }).createdAt ? new Date((msg as { createdAt?: Date | string }).createdAt!) : new Date(0),
    };
  }
  // Lấy tin nhắn chưa đọc
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
  // Lấy người dùng online cho từng phòng
  async getOnlineMemberIds(roomId: string): Promise<string[]> {
    const members = await this.conversationMemberModel
      .find({ conversationId: new Types.ObjectId(roomId) })
      .select('userId')
      .lean();

    const uniqueMembersMap = new Map<string, string>();
    members.forEach((m) => {
      const userId = String(m.userId);
      if (!uniqueMembersMap.has(userId)) {
        uniqueMembersMap.set(userId, userId);
      }
    });

    const userIds = Array.from(uniqueMembersMap.values());

    const onlineChecks = await Promise.all(userIds.map((uid) => this.redisClient.get(`user:online:${uid}`)));

    const onlineMembers = userIds.filter((uid, idx) => onlineChecks[idx] === '1');

    return onlineMembers;
  }
  // Lấy tất các thông tin : tin nhắn cuối , người dùng online, tin nhắn chưa đọc
  async getRoomSidebarInfo(userId: string): Promise<RoomSidebarInfo[]> {
    try {
      const rooms = await this.getRooms(userId);
      const result: RoomSidebarInfo[] = [];
      for (const room of rooms) {
        try {
          const membersRaw = await this.conversationMemberModel
            .find({ conversationId: new Types.ObjectId(room.roomId) })
            .populate('userId', 'name avatarURL')
            .lean();
          const uniqueMembersMap = new Map<string, PopulatedUser>();
          membersRaw.forEach((m) => {
            if (!m.userId) return;
            const u = m.userId as PopulatedUser;
            if (!uniqueMembersMap.has(u._id.toString()) || m.role === 'admin') {
              uniqueMembersMap.set(u._id.toString(), u);
            }
          });
          const members: RoomMemberInfo[] = Array.from(uniqueMembersMap.values()).map((u) => ({
            userId: u._id.toString(),
            name: u.name || '',
            avatarURL: u.avatarURL || '',
          }));

          const lastMessage = await this.getLastMessage(room.roomId);
          const unreadCount = await this.getUnreadCount(room.roomId, userId);
          const onlineMemberIds = await this.getOnlineMemberIds(room.roomId);

          let displayName = room.name;
          if (room.type === 'private' && members.length === 2) {
            const other = members.find((m) => m.userId !== userId);
            if (other) displayName = other.name;
          } else if (room.type === 'group') {
            displayName = `Group: ${room.name}`;
          } else if (room.type === 'support') {
            displayName = `SP: ${room.name}`;
          }
          const sidebarInfo = {
            roomId: room.roomId,
            name: displayName,
            isGroup: room.type === 'group',
            members,
            lastMessage,
            unreadCount,
            onlineMemberIds,
          };
          result.push(sidebarInfo);
        } catch (err) {
          console.error(`[getRoomSidebarInfo] ERROR in roomId=${room.roomId}:`, err);
        }
      }
      return result;
    } catch (err) {
      throw err;
    }
  }
  // Utility method to clean up duplicate conversation members
  async cleanupDuplicateMembers(conversationId: string): Promise<{ removed: number }> {
    const members = await this.conversationMemberModel.find({ conversationId: new Types.ObjectId(conversationId) }).lean();

    const seen = new Set<string>();
    const toRemove: string[] = [];

    members.forEach((member) => {
      const userId = String(member.userId);
      if (seen.has(userId)) {
        toRemove.push((member._id as Types.ObjectId).toString());
      } else {
        seen.add(userId);
      }
    });

    if (toRemove.length > 0) {
      await this.conversationMemberModel.deleteMany({
        _id: { $in: toRemove.map((id) => new Types.ObjectId(id)) },
      });
    }

    return { removed: toRemove.length };
  }

  async assignAdminToUser(userId: string) {
    // 1. Kiểm tra đã có phòng support nào chưa (dù admin online/offline, pending true/false)
    const existingRoom = await this.conversationModel.findOne({
      type: 'support',
      memberIds: userId,
      isDeleted: false,
      isActive: true,
    });
    let admin = null;
    if (existingRoom) {
      // Lấy admin hiện tại nếu có
      if (existingRoom.currentAdminId) {
        admin = await this.userModel.findById(existingRoom.currentAdminId);
      }
      return { roomId: existingRoom._id, admin, pending: !!existingRoom.pending };
    }

    // 2. Nếu chưa có phòng, kiểm tra admin online
    const admins = await this.userModel.find({ role: 'admin', isActive: true });
    const onlineChecks = await Promise.all(admins.map((a) => this.redisClient.get(`user:online:${a._id.toString()}`)));
    const onlineAdmins = admins.filter((a, idx) => onlineChecks[idx] === '1');
    const user = await this.userModel.findById(userId);
    const userName = user?.name || user?.email || userId;

    if (onlineAdmins.length === 0) {
      // Không có admin online, tạo phòng pending
      const room = await this.conversationModel.create({
        name: `Hỗ trợ: ${userName}`,
        type: 'support',
        creatorId: new Types.ObjectId(userId),
        memberIds: [userId],
        assignedAdmins: [],
        currentAdminId: null,
        isTemporary: true,
        isActive: true,
        pending: true,
      });
      // Đảm bảo user là member trong ConversationMember
      const userObjectId = new Types.ObjectId(userId);
      const existingUserMember = await this.conversationMemberModel.findOne({
        userId: { $in: [userId, userObjectId] },
        conversationId: room._id,
      });
      if (!existingUserMember) {
        await this.conversationMemberModel.create({
          userId: new Types.ObjectId(userId),
          conversationId: room._id,
          role: 'member',
          joinedAt: new Date(),
        });
      }
      return { roomId: room._id, admin: null, pending: true };
    }

    // Có admin online, chọn admin có ít phòng đang xử lý nhất
    const adminRoomCounts: Record<string, number> = {};
    for (const admin of onlineAdmins) {
      adminRoomCounts[admin._id.toString()] = await this.conversationModel.countDocuments({
        currentAdminId: admin._id,
        isActive: true,
        isDeleted: false,
        pending: false,
      });
    }

    // Sắp xếp theo số phòng đang xử lý (ít nhất trước)
    const sortedAdmins = onlineAdmins.sort((a, b) => (adminRoomCounts[a._id.toString()] || 0) - (adminRoomCounts[b._id.toString()] || 0));

    const assignedAdmin = sortedAdmins[0];
    const room = await this.conversationModel.create({
      name: `Hỗ trợ: ${userName}`,
      type: 'support',
      creatorId: new Types.ObjectId(userId),
      memberIds: [userId, assignedAdmin._id],
      assignedAdmins: [assignedAdmin._id],
      currentAdminId: assignedAdmin._id,
      isTemporary: true,
      isActive: true,
      pending: false,
    });

    // Đảm bảo user là member trong ConversationMember
    const userObjectId = new Types.ObjectId(userId);
    const existingUserMember = await this.conversationMemberModel.findOne({
      userId: { $in: [userId, userObjectId] },
      conversationId: room._id,
    });
    if (!existingUserMember) {
      await this.conversationMemberModel.create({
        userId: new Types.ObjectId(userId),
        conversationId: room._id,
        role: 'member',
        joinedAt: new Date(),
      });
    }

    // Đảm bảo admin là member trong ConversationMember
    const adminObjectId = new Types.ObjectId(assignedAdmin._id);
    const existingAdminMember = await this.conversationMemberModel.findOne({
      userId: { $in: [assignedAdmin._id, adminObjectId] },
      conversationId: room._id,
    });
    if (!existingAdminMember) {
      await this.conversationMemberModel.create({
        userId: new Types.ObjectId(assignedAdmin._id),
        conversationId: room._id,
        role: 'admin',
        joinedAt: new Date(),
      });
    }

    // Set timeout chờ admin phản hồi (5 phút)
    await this.redisClient.setex(`support:room:${String(room._id)}:waiting_admin`, 300, String(assignedAdmin._id));
    return { roomId: room._id, admin: assignedAdmin, pending: false };
  }

  async assignPendingRoomsToAdmins() {
    const pendingRooms = await this.conversationModel.find({
      pending: true,
      isActive: true,
      isDeleted: false,
      type: 'support',
    });

    if (pendingRooms.length === 0) {
      return [];
    }

    const admins = await this.userModel.find({ role: 'admin', isActive: true });
    const onlineChecks = await Promise.all(admins.map((a) => this.redisClient.get(`user:online:${a._id.toString()}`)));
    const onlineAdmins = admins.filter((a, idx) => onlineChecks[idx] === '1');

    if (onlineAdmins.length === 0) {
      return [];
    }

    // Đếm số phòng đang xử lý của mỗi admin
    const adminRoomCounts: Record<string, number> = {};
    for (const admin of onlineAdmins) {
      adminRoomCounts[admin._id.toString()] = await this.conversationModel.countDocuments({
        currentAdminId: admin._id,
        isActive: true,
        isDeleted: false,
        pending: false,
      });
    }

    const assignedRooms: { roomId: string; admin: any; userId: string }[] = [];
    for (const room of pendingRooms) {
      // Sắp xếp admin theo số phòng đang xử lý (ít nhất trước)
      const sortedAdmins = onlineAdmins.sort((a, b) => (adminRoomCounts[a._id.toString()] || 0) - (adminRoomCounts[b._id.toString()] || 0));
      const selectedAdmin = sortedAdmins[0];

      if (selectedAdmin && room) {
        // Thêm admin vào memberIds nếu chưa có
        if (!room.memberIds.map((id) => id.toString()).includes(selectedAdmin._id.toString())) {
          room.memberIds.push(selectedAdmin._id);
        }

        // Thêm admin vào assignedAdmins nếu chưa có
        if (!room.assignedAdmins.map((id) => id.toString()).includes(selectedAdmin._id.toString())) {
          room.assignedAdmins.push(selectedAdmin._id);
        }

        room.currentAdminId = selectedAdmin._id;
        room.pending = false;
        await room.save();

        // Đảm bảo admin là member trong ConversationMember
        const adminObjectId = new Types.ObjectId(selectedAdmin._id);
        const existingAdminMember = await this.conversationMemberModel.findOne({
          userId: { $in: [selectedAdmin._id, adminObjectId] },
          conversationId: room._id,
        });
        if (!existingAdminMember) {
          await this.conversationMemberModel.create({
            userId: new Types.ObjectId(selectedAdmin._id),
            conversationId: room._id,
            role: 'admin',
            joinedAt: new Date(),
          });
        }

        // Set timeout cho admin mới (5 phút)
        await this.redisClient.setex(`support:room:${String(room._id)}:waiting_admin`, 300, String(selectedAdmin._id));

        // Cập nhật số phòng đang xử lý của admin
        adminRoomCounts[selectedAdmin._id.toString()] = (adminRoomCounts[selectedAdmin._id.toString()] || 0) + 1;

        // Lấy userId của phòng (không phải admin)
        const userId = room.memberIds.find((id) => id.toString() !== selectedAdmin._id.toString())?.toString() || '';
        assignedRooms.push({ roomId: String(room._id), admin: selectedAdmin, userId });
      }
    }
    return assignedRooms;
  }

  /**
   * Admin join vào phòng pending: thêm admin vào memberIds, assignedAdmins, cập nhật currentAdminId, pending=false
   */
  async adminJoinRoom(roomId: string, adminId: string) {
    if (!Types.ObjectId.isValid(roomId) || !Types.ObjectId.isValid(adminId)) {
      throw new BadRequestException('Invalid roomId or adminId');
    }
    const room = await this.conversationModel.findById(roomId);
    if (!room) throw new NotFoundException('Room not found');

    // Nếu đã có admin thì không cho join lại
    if (room.currentAdminId && room.currentAdminId.toString() === adminId) {
      return room;
    }

    // Kiểm tra admin có online không
    const adminOnline = await this.redisClient.get(`user:online:${adminId}`);
    if (adminOnline !== '1') {
      throw new BadRequestException('Admin is not online');
    }

    // Thêm admin vào memberIds nếu chưa có
    if (!room.memberIds.map((id) => id.toString()).includes(adminId)) {
      room.memberIds.push(new Types.ObjectId(adminId));
    }

    // Thêm admin vào assignedAdmins nếu chưa có
    if (!room.assignedAdmins.map((id) => id.toString()).includes(adminId)) {
      room.assignedAdmins.push(new Types.ObjectId(adminId));
    }

    room.currentAdminId = new Types.ObjectId(adminId);
    room.pending = false;
    await room.save();

    // Đảm bảo admin là member trong ConversationMember
    const adminObjectId = new Types.ObjectId(adminId);
    const existingAdminMember = await this.conversationMemberModel.findOne({
      userId: { $in: [adminId, adminObjectId] },
      conversationId: new Types.ObjectId(roomId),
    });
    if (!existingAdminMember) {
      await this.conversationMemberModel.create({
        userId: new Types.ObjectId(adminId),
        conversationId: new Types.ObjectId(roomId),
        role: 'admin',
        joinedAt: new Date(),
      });
    }

    // Set timeout cho admin mới (5 phút)
    await this.redisClient.setex(`support:room:${String(roomId)}:waiting_admin`, 300, String(adminId));

    // Đảm bảo user là member trong ConversationMember
    // Lấy tất cả userId là member (không phải admin) trong room.memberIds
    const adminIdStr = adminId.toString();
    for (const memberId of room.memberIds) {
      if (memberId.toString() !== adminIdStr) {
        const memberObjectId = new Types.ObjectId(memberId);
        const existingUserMember = await this.conversationMemberModel.findOne({
          userId: { $in: [memberId, memberObjectId] },
          conversationId: new Types.ObjectId(roomId),
        });
        if (!existingUserMember) {
          await this.conversationMemberModel.create({
            userId: new Types.ObjectId(memberId),
            conversationId: new Types.ObjectId(roomId),
            role: 'member',
            joinedAt: new Date(),
          });
        }
      }
    }
    return room;
  }

  // Đóng phòng chat support và xóa toàn bộ dữ liệu liên quan
  async closeSupportRoom(conversationId: string, closedBy: string) {
    // Kiểm tra thành viên
    const isMember = await this.isMemberOfConversation(closedBy, conversationId);
    if (!isMember) throw new ForbiddenException('Bạn không phải thành viên phòng này');
    // Xóa các thành viên phòng
    await this.conversationMemberModel.deleteMany({ conversationId });
    // Xóa các tin nhắn
    await this.messageModel.deleteMany({ conversationId });
    // Xóa các message status
    await this.messageStatusModel.deleteMany({ conversationId });
    // Xóa phòng
    const deleted = await this.conversationModel.findByIdAndDelete(conversationId);
    if (!deleted) throw new NotFoundException('Không tìm thấy phòng');
    return { success: true };
  }

  /**
   * Quét timeout admin, trả về danh sách phòng đã chuyển admin
   * @returns Array<{ roomId, userId, newAdminId }>
   */
  async checkAdminTimeouts(): Promise<Array<{ roomId: string; userId: string; newAdminId: string }>> {
    const changedRooms: Array<{ roomId: string; userId: string; newAdminId: string }> = [];
    const waitingKeys = await this.redisClient.keys('support:room:*:waiting_admin');

    for (const key of waitingKeys) {
      const exists = await this.redisClient.exists(key);
      if (exists) continue;

      const match = key.match(/support:room:(.+):waiting_admin/);
      if (!match) continue;

      const roomId = match[1];
      const room = await this.conversationModel.findById(roomId);
      if (!room) continue;

      const oldAdminId = room.currentAdminId?.toString();
      const admins = await this.userModel.find({ role: 'admin', isActive: true });
      const onlineChecks = await Promise.all(admins.map((a) => this.redisClient.get(`user:online:${a._id.toString()}`)));

      // Lọc admin online, loại trừ admin cũ
      const onlineAdmins = admins.filter((a, idx) => onlineChecks[idx] === '1' && a._id.toString() !== oldAdminId);

      // Nếu không có admin online khác, quay lại admin đầu tiên (nếu có)
      if (onlineAdmins.length === 0) {
        // Kiểm tra lại admin cũ có online không
        const oldAdminOnline = oldAdminId ? await this.redisClient.get(`user:online:${oldAdminId}`) : null;
        if (oldAdminOnline === '1') {
          // Admin cũ vẫn online, tiếp tục sử dụng
          const oldAdmin = admins.find((a) => a._id.toString() === oldAdminId);
          if (oldAdmin) {
            // Reset timeout cho admin cũ
            await this.redisClient.setex(`support:room:${String(roomId)}:waiting_admin`, 300, String(oldAdminId));
            continue;
          }
        }

        // Không có admin nào online, đặt phòng về trạng thái pending
        room.currentAdminId = null as unknown as Types.ObjectId;
        room.pending = true;
        await room.save();
        continue;
      }

      // Chọn admin mới (ưu tiên admin có ít phòng đang xử lý)
      const adminRoomCounts: Record<string, number> = {};
      for (const admin of onlineAdmins) {
        adminRoomCounts[admin._id.toString()] = await this.conversationModel.countDocuments({
          currentAdminId: admin._id,
          isActive: true,
          isDeleted: false,
          pending: false,
        });
      }

      // Sắp xếp theo số phòng đang xử lý (ít nhất trước)
      const sortedAdmins = onlineAdmins.sort((a, b) => (adminRoomCounts[a._id.toString()] || 0) - (adminRoomCounts[b._id.toString()] || 0));

      const newAdmin = sortedAdmins[0];
      room.currentAdminId = newAdmin._id;
      room.pending = false;

      if (!room.memberIds.map((id) => id.toString()).includes(newAdmin._id.toString())) {
        room.memberIds.push(newAdmin._id);
      }
      if (!room.assignedAdmins.map((id) => id.toString()).includes(newAdmin._id.toString())) {
        room.assignedAdmins.push(newAdmin._id);
      }

      await room.save();

      // Đảm bảo admin mới là member trong ConversationMember
      const newAdminObjectId = new Types.ObjectId(newAdmin._id);
      const existingAdminMember = await this.conversationMemberModel.findOne({
        userId: { $in: [newAdmin._id, newAdminObjectId] },
        conversationId: room._id,
      });
      if (!existingAdminMember) {
        await this.conversationMemberModel.create({
          userId: newAdmin._id,
          conversationId: room._id,
          role: 'admin',
          joinedAt: new Date(),
        });
      }

      // Set timeout cho admin mới
      await this.redisClient.setex(`support:room:${String(roomId)}:waiting_admin`, 300, String(newAdmin._id));

      // Lấy userId của phòng (không phải admin)
      const userId = room.memberIds.find((id) => id.toString() !== newAdmin._id.toString())?.toString() || '';
      changedRooms.push({ roomId, userId, newAdminId: newAdmin._id.toString() });
    }

    return changedRooms;
  }

  /**
   * Lấy danh sách adminId của các phòng active mà userId là thành viên
   */
  async getActiveAdminIdsByUserId(userId: string): Promise<string[]> {
    // Lấy tất cả phòng active có userId là thành viên
    const activeRooms = await this.conversationModel.find({
      type: 'support',
      memberIds: userId,
      isDeleted: false,
      isActive: true,
      pending: false,
    });
    const adminIds: string[] = [];
    for (const room of activeRooms) {
      // Lấy adminId từ memberIds có role admin
      const adminMembers = await this.conversationMemberModel.find({
        conversationId: room._id,
        role: 'admin',
      });
      for (const adminMember of adminMembers) {
        const adminId = adminMember.userId?.toString();
        if (adminId) adminIds.push(adminId);
      }
    }
    return adminIds;
  }

  /**
   * Lấy danh sách các adminId, adminName, roomId, userId, userName của các phòng active mà userId là thành viên
   */
  async getActiveAdminRoomPairsByUserId(userId: string): Promise<{ adminId: string; adminName: string; roomId: string; userId: string; userName: string }[]> {
    const activeRooms = await this.conversationModel.find({
      type: 'support',
      memberIds: userId,
      isDeleted: false,
      isActive: true,
      pending: false,
    });
    // Lấy userName
    const user = await this.userModel.findById(userId);
    const userName = user?.name || user?.email || userId;
    const result: { adminId: string; adminName: string; roomId: string; userId: string; userName: string }[] = [];
    for (const room of activeRooms) {
      const adminMembers = await this.conversationMemberModel.find({
        conversationId: room._id,
        role: 'admin',
      });
      for (const adminMember of adminMembers) {
        const adminId = adminMember.userId?.toString();
        if (adminId) {
          // Lấy adminName
          const admin = await this.userModel.findById(adminId);
          const adminName = admin?.name || admin?.email || adminId;
          result.push({ adminId, adminName, roomId: (room._id as Types.ObjectId).toString(), userId, userName });
        }
      }
    }
    return result;
  }

  /**
   * Lấy tất cả các phòng hỗ trợ đang pending (chưa có admin), kèm thông tin user
   */
  async getAllPendingSupportRooms(): Promise<Array<{ roomId: string; userId?: string; userName: string; userEmail: string }>> {
    const pendingRooms = await this.conversationModel.find({
      pending: true,
      isActive: true,
      isDeleted: false,
      type: 'support',
    });
    const result: Array<{ roomId: string; userId?: string; userName: string; userEmail: string }> = [];
    for (const room of pendingRooms) {
      // Lấy userId là thành viên duy nhất (chưa có admin)
      const memberIds = room.memberIds.map((id) => id.toString());
      let userId: string | undefined = undefined;
      if (memberIds.length === 1) {
        userId = memberIds[0];
      } else if (room.currentAdminId) {
        userId = memberIds.find((id) => id !== room.currentAdminId.toString());
      } else {
        userId = memberIds[0];
      }
      const user = userId ? await this.userModel.findById(userId) : null;
      result.push({
        roomId: String(room._id),
        userId: userId || undefined,
        userName: user?.name || user?.email || userId || '',
        userEmail: user?.email || '',
      });
    }
    return result;
  }

  async getAllUsersWithPagination(query: PaginationQueryDto & { conversationId?: string }): Promise<{
    success: boolean;
    data: any[];
    total: number;
    currentPage: number;
    totalPages: number;
  }> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    let filter: FilterQuery<UserDocument> = {};
    if (query.conversationId) {
      // Ưu tiên lấy memberIds từ Conversation
      const conversation = await this.conversationModel.findById(query.conversationId).select('memberIds');
      let memberIds: string[] = [];
      if (conversation && Array.isArray(conversation.memberIds)) {
        memberIds = conversation.memberIds.map((id) => id.toString());
      } else {
        // Fallback: lấy từ ConversationMember nếu không có memberIds
        const members = await this.conversationMemberModel.find({ conversationId: new Types.ObjectId(query.conversationId) }).select('userId');
        memberIds = members.map((m) => m.userId.toString());
      }
      filter = { _id: { $nin: memberIds } };
    }
    const [users, total] = await Promise.all([
      this.userModel
        .find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.userModel.countDocuments(filter),
    ]);
    return {
      success: true,
      data: users,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async addMembers(roomId: string, userIds: string[]) {
    // Giả sử đã có hàm addMember(roomId, userId, currentUserId)
    const results = await Promise.all(userIds.map((userId) => this.addMember(roomId, userId)));
    return { success: true, added: results };
  }

  // Lấy vai trò của user trong phòng chat
  async getUserRoleInRoom(conversationId: string, userId: string): Promise<string | null> {
    const userObjectId = new Types.ObjectId(userId);
    const member = await this.conversationMemberModel.findOne({
      userId: { $in: [userId, userObjectId] },
      conversationId: new Types.ObjectId(conversationId),
    });
    return member ? member.role : null;
  }
}
