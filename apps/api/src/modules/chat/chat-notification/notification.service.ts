import { Injectable } from '@nestjs/common';
export interface NotificationSummary {
  id: string;
  content: string;
  read: boolean;
  userId: string;
}

@Injectable()
export class NotificationService {}
