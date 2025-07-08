import { Module } from '@nestjs/common';
import { ChatGateway } from '@api/gateway/chat.gateway';
import { ChatService } from '@api/gateway/chat.service';
import { MessageModule } from '@api/modules/chat-message/message.module';
import { UserChatModule } from '@api/modules/chat-user/user-chat.module';
import { RoomModule } from '@api/modules/chat-room/room.module';
import { NotificationModule } from '@api/modules/chat-notification/notification.module';
import { ReactionModule } from '@api/modules/chat-reactions/reaction.module';

@Module({
  imports: [MessageModule, UserChatModule, RoomModule, NotificationModule, ReactionModule],
  providers: [ChatGateway, ChatService],
  exports: [ChatGateway],
})
export class GatewayModule {}
