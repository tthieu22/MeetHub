import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BlockedUser, BlockedUserSchema } from './schema/user-chat-blocked.schema';
import { OnlineUsersService } from './online-users.service';
import { TokenOnlineService } from './token-online.service';
import { UserChatController } from './user-chat.controller';
import { UserChatService } from './user-chat.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: BlockedUser.name, schema: BlockedUserSchema }])],
  controllers: [UserChatController],
  providers: [OnlineUsersService, TokenOnlineService, UserChatService],
  exports: [OnlineUsersService, TokenOnlineService, UserChatService],
})
export class UserChatModule {}
