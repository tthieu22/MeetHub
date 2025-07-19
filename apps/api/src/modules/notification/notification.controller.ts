import { Controller, Get, Put, Request, UseGuards } from '@nestjs/common';
import { NotificationRes, NotificationService } from './notification.service';
import { InjectModel } from '@nestjs/mongoose';
import { AuthGuard } from '@api/auth/auth.guard';
import { Notification } from './schema/notification.schema';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}
  @Get('my')
  @UseGuards(AuthGuard)
  async getMyNotifications(@Request() req): Promise<NotificationRes> {
    const userId = req.user._id;
    return this.notificationService.findByReceiver(userId);
  }

  @Put('mark-read')
  @UseGuards(AuthGuard)
  async markAllRead(@Request() req) {
    const userId = req.user._id;
    await this.notificationService.markAllRead(userId);
    return { success: true };
  }
}
