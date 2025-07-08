import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { MessageModule } from '../modules/chat-message/message.module';
import { UserChatModule } from '../modules/chat-user/user-chat.module';

@Module({
  imports: [MessageModule, UserChatModule],
  providers: [ChatGateway, ChatService],
  exports: [ChatGateway],
})
export class GatewayModule {}
