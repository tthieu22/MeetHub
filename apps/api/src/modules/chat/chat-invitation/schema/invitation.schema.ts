import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InvitationDocument = Invitation & Document;

export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  EXPIRED = 'expired',
}

@Schema({ timestamps: { createdAt: true, updatedAt: true } })
export class Invitation {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  senderId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  receiverId: Types.ObjectId;

  @Prop({ required: true, enum: InvitationStatus, default: InvitationStatus.PENDING })
  status: InvitationStatus;

  @Prop({ type: String, default: 'Bạn có muốn bắt đầu cuộc trò chuyện không?' })
  message: string;

  @Prop({ type: Date, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }) // 7 days
  expiresAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'Conversation', default: null })
  conversationId?: Types.ObjectId;
}

export const InvitationSchema = SchemaFactory.createForClass(Invitation);

// Indexes for better performance
InvitationSchema.index({ senderId: 1, receiverId: 1, status: 1 });
InvitationSchema.index({ receiverId: 1, status: 1 });
InvitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto delete expired invitations
