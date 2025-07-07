import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageStatusDocument = MessageStatus & Document;

@Schema({ timestamps: { createdAt: false, updatedAt: false } })
export class MessageStatus {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Message' })
  messageId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ type: Boolean, default: false })
  isRead: boolean;

  @Prop({ type: Date, default: null })
  readAt: Date;
}

export const MessageStatusSchema = SchemaFactory.createForClass(MessageStatus);
