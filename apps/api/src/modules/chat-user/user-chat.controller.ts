import { Controller, Get, Post, Body, Headers } from '@nestjs/common';
import { OnlineUsersService } from './online-users.service';
import { TokenOnlineService } from './token-online.service';

@Controller('chat-users')
export class UserChatController {
  constructor(
    private onlineUsersService: OnlineUsersService,
    private tokenOnlineService: TokenOnlineService,
  ) {}

  @Get('/online')
  getOnlineUsers() {
    return this.onlineUsersService.getOnlineUsers();
  }

  @Post('/online/emit')
  emitOnlineUsers() {
    const onlineUsers = this.onlineUsersService.getOnlineUsers();
    return { success: true, message: 'Emitted online users', data: onlineUsers };
  }

  @Post('/online/token')
  addUserOnlineFromToken(@Headers('authorization') authorization: string, @Body() body: { clientId: string }) {
    if (!authorization) {
      return { success: false, message: 'Authorization header is required' };
    }

    const result = this.tokenOnlineService.addUserOnlineFromToken(authorization, body.clientId);

    return result;
  }

  @Post('/online/remove')
  removeUserOnline(@Body() body: { clientId: string }) {
    return this.tokenOnlineService.removeUserOnline(body.clientId);
  }

  @Post('/user-id')
  getUserIdFromToken(@Headers('authorization') authorization: string) {
    if (!authorization) {
      return { success: false, message: 'Authorization header is required' };
    }

    return this.tokenOnlineService.extractUserIdFromToken(authorization);
  }
}
