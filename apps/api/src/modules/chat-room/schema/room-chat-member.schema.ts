import { Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ConversationMembersDocument = ConversationMembers & Document;

export class ConversationMembers {
  @Prop({ required: true })
  _id: Types.ObjectId;

  @Prop({ required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, ref: 'Conversation' })
  conversationId: Types.ObjectId;

  @Prop({ required: true, enum: ['admin', 'member'] })
  role: string;

  @Prop({ required: true })
  joinedAt: Date;
}

export const ConversationMembersSchema = SchemaFactory.createForClass(ConversationMembers);
