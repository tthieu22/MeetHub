import { Module } from '@nestjs/common';
import { ChatGateway } from '@api/gateway/chat.gateway';
import { ChatService } from '@api/gateway/chat.service';
import { MessageModule } from '@api/modules/chat/chat-message/message.module';
import { UserChatModule } from '@api/modules/chat/chat-user/user-chat.module';
import { RoomModule } from '@api/modules/chat/chat-room/room.module';
import { NotificationModule } from '@api/modules/chat/chat-notification/notification.module';
import { ReactionModule } from '@api/modules/chat/chat-reactions/reaction.module';
import { UsersModule } from '@api/modules/users/users.module';
import { WsAuthGuard } from '@api/common/guards/ws-auth.guard';
import { WsAuthService } from '@api/common/services/ws-auth.service';
import { ChatEventsHandler } from './chat-events.handler';

@Module({
  imports: [MessageModule, UserChatModule, RoomModule, NotificationModule, ReactionModule, UsersModule],
  providers: [ChatGateway, ChatService, WsAuthGuard, WsAuthService, ChatEventsHandler],
  exports: [ChatGateway],
})
export class GatewayModule {}
