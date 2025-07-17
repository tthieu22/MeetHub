import { BadRequestException, Injectable } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Notification, NotificationDocument } from './schema/notification.schema';
import { Model } from 'mongoose';
import { NotificationGateway } from './notification.gateway';
export interface NotificationRes {
  success: boolean;
  data: Notification[]; // là mảng các notification
}
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
  async findByReceiver(userId: string): Promise<NotificationRes> {
    try {
      const data = await this.notificationDocumentModel.find({ receiverId: userId }).sort({ createdAt: -1 }).lean();
      return {
        success: true,
        data,
      };
    } catch (error) {
      throw new BadRequestException();
    }
  }


  async markAllRead(userId: string) {
    await this.notificationDocumentModel.updateMany(
      { receiverId: userId, isRead: false },
      { $set: { isRead: true } }
    );
  }

}
