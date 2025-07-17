import { Module, forwardRef } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { WsAuthModule } from '@api/common/ws-auth.module';
import { SupportAdminTimeoutService } from './support-admin-timeout.service';
import { UsersModule } from '../modules/users/users.module';
import { MessageModule } from '@api/modules/chat/chat-message/message.module';
import { RoomModule } from '@api/modules/chat/chat-room/room.module';
import { UploadImageModule } from '@api/modules/upload/upload.module';
import { ConnectionHandler } from './handlers/connection.handler';
import { RoomHandler } from './handlers/room.handler';
import { MessageHandler } from './handlers/message.handler';
import { UserHandler } from './handlers/user.handler';
import { SupportHandler } from './handlers/support.handler';
import { UserChatModule } from '@api/modules/chat/chat-user/user-chat.module';
import { ReactionModule } from '@api/modules/chat/chat-reactions/reaction.module';

@Module({
  imports: [WsAuthModule, UsersModule, ReactionModule, MessageModule, RoomModule, UserChatModule, forwardRef(() => UploadImageModule)],
  providers: [ChatGateway, ChatService, SupportAdminTimeoutService, ConnectionHandler, RoomHandler, MessageHandler, UserHandler, SupportHandler],
  exports: [ChatGateway, ChatService],
})
export class GatewayModule {}
