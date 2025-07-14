import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

export enum NotificationType {
  MENTION = 'mention', // Được mention trong tin nhắn
  SYSTEM = 'system', // Thông báo hệ thống
  IMPORTANT = 'important', // Sự kiện quan trọng
  CUSTOM = 'custom', // User tự tạo
}

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Notification {
  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: String, enum: NotificationType, default: NotificationType.CUSTOM })
  type: NotificationType;

  @Prop({ type: String, default: null })
  roomId?: string;

  @Prop({ type: Types.ObjectId, ref: 'Message', default: null })
  messageId?: Types.ObjectId;

  @Prop({ type: Boolean, default: false })
  isRead: boolean;

  @Prop({ type: Date, default: null })
  readAt?: Date;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;

  @Prop({ type: Date, default: null })
  deletedAt?: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
