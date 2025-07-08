import { Injectable } from '@nestjs/common';
import { CreateNotificationDto, UpdateNotificationDto, DeleteNotificationDto, MarkAsReadDto, NotificationDto } from './dto/create-notification.dto';

export interface NotificationSummary {
  id: string;
  content: string;
  read: boolean;
  userId: string;
}

@Injectable()
export class NotificationService {
  createNotification(data: CreateNotificationDto): Promise<NotificationDto> {
    // TODO: Implement logic to create notification
    return Promise.resolve({
      _id: Date.now().toString(),
      userId: data.userId,
      content: data.content,
      type: data.type,
      read: false,
      createdAt: data.createdAt || new Date(),
    });
  }

  getNotifications(userId: string): Promise<NotificationDto[]> {
    // TODO: Implement logic to get notifications for a user
    return Promise.resolve([
      {
        _id: 'sample',
        userId,
        content: 'Sample notification',
        type: 'message',
        read: false,
        createdAt: new Date(),
      },
    ]);
  }

  updateNotification(notificationId: string, data: UpdateNotificationDto): Promise<NotificationDto> {
    // TODO: Implement logic to update notification
    return Promise.resolve({
      _id: notificationId,
      userId: 'userId',
      content: data.content || '',
      type: data.type || 'message',
      read: data.read ?? false,
      createdAt: new Date(),
    });
  }

  deleteNotification(notificationId: string): Promise<DeleteNotificationDto> {
    // TODO: Implement logic to delete notification
    return Promise.resolve({ notificationId });
  }

  markAsRead(notificationId: string, userId: string): Promise<MarkAsReadDto> {
    // TODO: Implement logic to mark notification as read
    return Promise.resolve({ notificationId, userId });
  }

  getNotificationById(notificationId: string): Promise<NotificationDto> {
    // TODO: Implement logic to get notification by id
    return Promise.resolve({
      _id: notificationId,
      userId: 'userId',
      content: 'Sample notification',
      type: 'message',
      read: false,
      createdAt: new Date(),
    });
  }

  getUnreadNotifications(userId: string): NotificationSummary[] {
    return [
      { id: '1', content: 'Bạn có tin nhắn mới', read: false, userId },
      { id: '2', content: 'Bạn được nhắc đến', read: false, userId },
    ];
  }
}
