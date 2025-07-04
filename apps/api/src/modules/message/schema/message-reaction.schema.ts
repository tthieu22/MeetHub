import { Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageReactionsDocument = MessageReactions & Document;

export class MessageReactions {
  @Prop({ required: true })
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Message' })
  messageId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true })
  emoji: string;

  @Prop({ type: Date, default: Date.now })
  reactedAt: Date;
}

export const MessageReactionsSchema = SchemaFactory.createForClass(MessageReactions);
