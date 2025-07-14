import { IsString, IsOptional, IsEnum, IsMongoId, IsBoolean } from 'class-validator';
import { NotificationType } from '@api/modules/chat/chat-notification/schema/notification.schema';

export class CreateNotificationDto {
  @IsMongoId()
  userId: string;

  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType = NotificationType.CUSTOM;

  @IsOptional()
  @IsString()
  roomId?: string;

  @IsOptional()
  @IsMongoId()
  messageId?: string;
}

export class UpdateNotificationDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @IsOptional()
  @IsBoolean()
  isRead?: boolean;
}

export class DeleteNotificationDto {
  @IsMongoId()
  notificationId: string;
}

export class MarkAsReadDto {
  @IsMongoId()
  notificationId: string;

  @IsMongoId()
  userId: string;
}

export interface NotificationDto {
  _id: string;
  userId: string;
  title: string;
  content: string;
  type: NotificationType;
  roomId?: string;
  messageId?: string;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}
