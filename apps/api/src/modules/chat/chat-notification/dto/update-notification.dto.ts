export class UpdateNotificationDto {
  notificationId: string;
  content?: string;
  type?: string;
  read?: boolean;
}

export class DeleteNotificationDto {
  notificationId: string;
}

export class MarkAsReadDto {
  notificationId: string;
  userId: string;
}
