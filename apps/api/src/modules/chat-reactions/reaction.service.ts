import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Reaction, ReactionDocument } from './schema/reaction.schema';

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
}
