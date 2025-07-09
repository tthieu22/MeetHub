import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ConversationMemberDocument = ConversationMember & Document;

@Schema({ timestamps: { createdAt: 'joinedAt', updatedAt: false } })
export class ConversationMember {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Conversation' })
  conversationId: Types.ObjectId;

  @Prop({ required: true, enum: ['admin', 'member'], default: 'member' })
  role: string;
}

export const ConversationMemberSchema = SchemaFactory.createForClass(ConversationMember);
