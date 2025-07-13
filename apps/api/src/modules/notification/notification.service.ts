import { Injectable } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Notification, NotificationDocument } from './schema/notification.schema';
import { Model } from 'mongoose';
import { NotificationGateway } from './notification.gateway';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name) private notificationDocumentModel: Model<NotificationDocument>,
    private readonly gateway: NotificationGateway,
  ) {}

  async notify(userId: string, message: string, type: string) {
    const noti = await this.notificationDocumentModel.create({ receiverId: userId, content: message, type: type });
    this.gateway.sendToUser(userId, noti); // realtime
  }
}
