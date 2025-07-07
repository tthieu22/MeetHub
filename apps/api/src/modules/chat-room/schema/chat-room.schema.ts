import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ConversationDocument = Conversation & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: true } })
export class Conversation {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: ['private', 'group'] })
  type: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  creatorId: Types.ObjectId;

  @Prop({ required: true, default: false })
  isDeleted: boolean;

  @Prop({ type: Date })
  deletedAt?: Date;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
