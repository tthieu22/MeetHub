import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Reaction, ReactionDocument } from '@api/modules/chat/chat-reactions/schema/reaction.schema';

export interface ReactionInfo {
  messageId: string;
  userId: string;
  emoji: string;
}

@Injectable()
export class ReactionService {
  constructor(@InjectModel(Reaction.name) private reactionModel: Model<ReactionDocument>) {}

  async addReaction(messageId: string, userId: string, emoji: string) {
    // Kiểm tra xem user đã reaction với emoji này chưa
    const existingReaction = await this.reactionModel.findOne({
      messageId: new Types.ObjectId(messageId),
      userId: new Types.ObjectId(userId),
      emoji,
    });

    if (existingReaction) {
      // Nếu đã có thì xóa (toggle)
      await this.reactionModel.findByIdAndDelete(existingReaction._id);
      return { message: 'Reaction removed' };
    } else {
      // Nếu chưa có thì thêm mới
      const newReaction = new this.reactionModel({
        messageId: new Types.ObjectId(messageId),
        userId: new Types.ObjectId(userId),
        emoji,
      });
      await newReaction.save();
      return { message: 'Reaction added', reaction: newReaction };
    }
  }

  async getReactions(messageId: string) {
    const reactions = await this.reactionModel
      .find({ messageId: new Types.ObjectId(messageId) })
      .populate('userId', 'username avatar')
      .exec();

    return reactions;
  }

  async removeReaction(messageId: string, userId: string, emoji: string) {
    // Xóa reaction cụ thể của user với emoji trên message
    await this.reactionModel.deleteOne({
      messageId: new Types.ObjectId(messageId),
      userId: new Types.ObjectId(userId),
      emoji,
    });
    return { message: 'Reaction removed' };
  }

  listReactionsForMessage(messageId: string): ReactionInfo[] {
    return [
      { messageId, userId: '1', emoji: '👍' },
      { messageId, userId: '2', emoji: '❤️' },
    ];
  }
}
