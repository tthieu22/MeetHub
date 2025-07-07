import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ConversationDocument = Conversation & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: true } })
export class Conversation {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true, default: false })
  isDeleted: boolean;

  @Prop({ required: true })
  creatorId: string;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
