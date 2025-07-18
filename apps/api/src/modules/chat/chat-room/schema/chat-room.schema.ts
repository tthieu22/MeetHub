import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ConversationDocument = Conversation & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: true } })
export class Conversation {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: ['private', 'group', 'support'] })
  type: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  creatorId: Types.ObjectId;

  @Prop({ required: true, default: false })
  isDeleted: boolean;

  @Prop({ type: Date })
  deletedAt?: Date;

  // Thêm trường lastMessage
  @Prop({
    type: {
      content: String,
      createdAt: Date,
      senderId: { type: Types.ObjectId, ref: 'User' },
    },
    default: null,
  })
  lastMessage?: {
    content: string;
    createdAt: Date;
    senderId: Types.ObjectId;
  };

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  memberIds: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  assignedAdmins: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  currentAdminId: Types.ObjectId;

  @Prop({ type: Date, default: null })
  lastAdminReplyAt?: Date;

  @Prop({ default: false })
  isTemporary: boolean;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  pending: boolean;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
