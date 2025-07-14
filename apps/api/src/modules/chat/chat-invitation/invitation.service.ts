import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Invitation, InvitationDocument, InvitationStatus } from './schema/invitation.schema';
import { Conversation, ConversationDocument } from '../chat-room/schema/chat-room.schema';
import { ConversationMember, ConversationMemberDocument } from '../chat-room/schema/conversation-member.schema';
import { CreateInvitationDto, RespondToInvitationDto } from './dto/create-invitation.dto';

export interface UserPopulated {
  _id: Types.ObjectId;
  name: string;
  email: string;
  avatarURL?: string;
}

export interface InvitationLean {
  _id: Types.ObjectId;
  senderId: UserPopulated;
  receiverId: UserPopulated;
  message: string;
  status: InvitationStatus;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class InvitationService {
  constructor(
    @InjectModel(Invitation.name) private invitationModel: Model<InvitationDocument>,
    @InjectModel(Conversation.name) private conversationModel: Model<ConversationDocument>,
    @InjectModel(ConversationMember.name) private conversationMemberModel: Model<ConversationMemberDocument>,
  ) {}

  /**
   * Tạo lời mời chat
   */
  async createInvitation(senderId: string, createInvitationDto: CreateInvitationDto) {
    const { receiverId, message } = createInvitationDto;

    // Kiểm tra không thể mời chính mình
    if (senderId === receiverId) {
      return {
        success: false,
        message: 'Không thể mời chính mình',
      };
    }

    // Kiểm tra đã có lời mời pending chưa (cả 2 chiều)
    const existingInvitation = await this.invitationModel.findOne({
      $or: [
        { senderId: new Types.ObjectId(senderId), receiverId: new Types.ObjectId(receiverId), status: InvitationStatus.PENDING },
        { senderId: new Types.ObjectId(receiverId), receiverId: new Types.ObjectId(senderId), status: InvitationStatus.PENDING },
      ],
    });

    if (existingInvitation) {
      // Kiểm tra xem lời mời hiện tại có phải do người khác gửi không
      if (existingInvitation.senderId.toString() === senderId) {
        return {
          success: false,
          message: 'Bạn đã gửi lời mời cho người này rồi',
        };
      } else {
        return {
          success: false,
          message: 'Người này đã gửi lời mời cho bạn rồi. Vui lòng kiểm tra phần lời mời đã nhận.',
        };
      }
    }

    // Kiểm tra xem đã có conversation giữa 2 người chưa
    const existingConversation = await this.conversationModel.aggregate([
      {
        $lookup: {
          from: 'conversationmembers',
          localField: '_id',
          foreignField: 'conversationId',
          as: 'members',
        },
      },
      {
        $match: {
          'members.userId': {
            $all: [new Types.ObjectId(senderId), new Types.ObjectId(receiverId)],
          },
          type: 'private',
          'members.0': { $exists: true },
          'members.1': { $exists: true },
          $expr: { $eq: [{ $size: '$members' }, 2] },
        },
      },
    ]);

    if (existingConversation.length > 0) {
      return {
        success: false,
        message: 'Bạn đã có cuộc trò chuyện với người này rồi',
      };
    }

    // Tạo lời mời mới
    const invitation = new this.invitationModel({
      senderId: new Types.ObjectId(senderId),
      receiverId: new Types.ObjectId(receiverId),
      message: message || 'Bạn có muốn bắt đầu cuộc trò chuyện không?',
      status: InvitationStatus.PENDING,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    await invitation.save();

    return {
      success: true,
      data: {
        invitationId: (invitation._id as Types.ObjectId).toString(),
        message: 'Lời mời đã được gửi thành công',
      },
    };
  }

  /**
   * Lấy danh sách lời mời đã nhận
   */
  async getReceivedInvitations(userId: string) {
    const invitations = await this.invitationModel
      .find({
        receiverId: new Types.ObjectId(userId),
        status: InvitationStatus.PENDING,
        expiresAt: { $gt: new Date() },
      })
      .populate('senderId', 'name email avatarURL')
      .sort({ createdAt: -1 })
      .select('_id senderId message expiresAt createdAt')
      .lean()
      .exec();

    return {
      success: true,
      data: (invitations as unknown as InvitationLean[]).map((invitation) => ({
        invitationId: invitation._id.toString(),
        sender: invitation.senderId,
        message: invitation.message,
        createdAt: invitation.createdAt,
        expiresAt: invitation.expiresAt,
      })),
    };
  }

  /**
   * Lấy danh sách lời mời đã gửi
   */
  async getSentInvitations(userId: string) {
    const invitations = await this.invitationModel
      .find({
        senderId: new Types.ObjectId(userId),
        status: { $in: [InvitationStatus.PENDING, InvitationStatus.ACCEPTED, InvitationStatus.DECLINED] },
      })
      .populate('receiverId', 'name email avatarURL')
      .sort({ createdAt: -1 })
      .select('_id receiverId message status createdAt updatedAt')
      .lean()
      .exec();

    return {
      success: true,
      data: (invitations as unknown as InvitationLean[]).map((invitation) => ({
        invitationId: invitation._id.toString(),
        receiver: invitation.receiverId,
        message: invitation.message,
        status: invitation.status,
        createdAt: invitation.createdAt,
        updatedAt: invitation.updatedAt,
      })),
    };
  }

  /**
   * Xử lý lời mời (accept/decline)
   */
  async respondToInvitation(userId: string, invitationId: string, respondDto: RespondToInvitationDto) {
    const { action } = respondDto;

    // Tìm lời mời
    const invitation = await this.invitationModel.findById(invitationId);
    if (!invitation) {
      return {
        success: false,
        message: 'Không tìm thấy lời mời',
      };
    }

    // Kiểm tra người xử lý có phải là người nhận không
    if (invitation.receiverId.toString() !== userId) {
      return {
        success: false,
        message: 'Bạn không có quyền xử lý lời mời này',
      };
    }

    // Kiểm tra trạng thái
    if (invitation.status !== InvitationStatus.PENDING) {
      return {
        success: false,
        message: 'Lời mời đã được xử lý',
      };
    }

    // Kiểm tra hết hạn
    if (invitation.expiresAt < new Date()) {
      invitation.status = InvitationStatus.EXPIRED;
      await invitation.save();
      return {
        success: false,
        message: 'Lời mời đã hết hạn',
      };
    }

    if (action === 'accept') {
      // Kiểm tra xem đã có conversation giữa 2 người chưa
      const existingConversation = await this.conversationModel.aggregate([
        {
          $lookup: {
            from: 'conversationmembers',
            localField: '_id',
            foreignField: 'conversationId',
            as: 'members',
          },
        },
        {
          $match: {
            'members.userId': {
              $all: [new Types.ObjectId(invitation.senderId.toString()), new Types.ObjectId(invitation.receiverId.toString())],
            },
            type: 'private',
            'members.0': { $exists: true },
            'members.1': { $exists: true },
            $expr: { $eq: [{ $size: '$members' }, 2] },
          },
        },
      ]);

      let conversationId: Types.ObjectId;

      if (existingConversation.length > 0) {
        // Sử dụng conversation hiện có
        conversationId = existingConversation[0]._id as Types.ObjectId;
      } else {
        // Tạo conversation mới
        const conversation = new this.conversationModel({
          name: `Chat giữa ${invitation.senderId.toString()} và ${invitation.receiverId.toString()}`,
          type: 'private',
          creatorId: new Types.ObjectId(invitation.senderId.toString()),
        });

        await conversation.save();
        conversationId = conversation._id as Types.ObjectId;

        // Thêm thành viên vào conversation
        const senderMember = new this.conversationMemberModel({
          userId: new Types.ObjectId(invitation.senderId.toString()),
          conversationId: conversationId,
          role: 'member',
        });

        const receiverMember = new this.conversationMemberModel({
          userId: new Types.ObjectId(invitation.receiverId.toString()),
          conversationId: conversationId,
          role: 'member',
        });

        await Promise.all([senderMember.save(), receiverMember.save()]);
      }

      // Cập nhật trạng thái lời mời
      invitation.status = InvitationStatus.ACCEPTED;
      invitation.conversationId = conversationId;
      await invitation.save();

      // Hủy tất cả lời mời pending khác giữa 2 người này
      await this.invitationModel.updateMany(
        {
          $or: [
            { senderId: new Types.ObjectId(invitation.senderId.toString()), receiverId: new Types.ObjectId(invitation.receiverId.toString()), status: InvitationStatus.PENDING },
            { senderId: new Types.ObjectId(invitation.receiverId.toString()), receiverId: new Types.ObjectId(invitation.senderId.toString()), status: InvitationStatus.PENDING },
          ],
          _id: { $ne: invitation._id },
        },
        { status: InvitationStatus.DECLINED },
      );

      return {
        success: true,
        data: {
          conversationId: conversationId,
          message: 'Lời mời đã được chấp nhận, cuộc trò chuyện đã được tạo',
        },
      };
    } else if (action === 'decline') {
      // Cập nhật trạng thái từ chối
      invitation.status = InvitationStatus.DECLINED;
      await invitation.save();

      return {
        success: true,
        data: {
          message: 'Lời mời đã được từ chối',
        },
      };
    }

    return {
      success: false,
      message: 'Hành động không hợp lệ',
    };
  }

  /**
   * Hủy lời mời (chỉ người gửi mới được hủy)
   */
  async cancelInvitation(userId: string, invitationId: string) {
    const invitation = await this.invitationModel.findById(invitationId);
    if (!invitation) {
      return {
        success: false,
        message: 'Không tìm thấy lời mời',
      };
    }

    // Kiểm tra người hủy có phải là người gửi không
    if (invitation.senderId.toString() !== userId) {
      return {
        success: false,
        message: 'Bạn không có quyền hủy lời mời này',
      };
    }

    // Kiểm tra trạng thái
    if (invitation.status !== InvitationStatus.PENDING) {
      return {
        success: false,
        message: 'Lời mời đã được xử lý',
      };
    }

    await this.invitationModel.findByIdAndDelete(invitationId);

    return {
      success: true,
      data: {
        message: 'Lời mời đã được hủy',
      },
    };
  }
}
