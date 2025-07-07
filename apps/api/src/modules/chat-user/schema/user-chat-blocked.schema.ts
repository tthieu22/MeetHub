import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BlockedUserDocument = BlockedUser & Document;

@Schema({ timestamps: { createdAt: 'blockedAt', updatedAt: false } })
export class BlockedUser {
  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  blockerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  blockedId: Types.ObjectId;
}

export const BlockedUserSchema = SchemaFactory.createForClass(BlockedUser);
