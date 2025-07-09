import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReactionDocument = Reaction & Document;

@Schema({ timestamps: { createdAt: 'reactedAt', updatedAt: false } })
export class Reaction {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Message' })
  messageId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true })
  emoji: string;
}

export const ReactionSchema = SchemaFactory.createForClass(Reaction);
