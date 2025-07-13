import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BlockedUser, BlockedUserSchema } from './schema/user-chat-blocked.schema';
import { User, UserSchema } from '../../users/schema/user.schema';
import { UserChatController } from './user-chat.controller';
import { UserChatService } from './user-chat.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BlockedUser.name, schema: BlockedUserSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [UserChatController],
  providers: [UserChatService],
  exports: [UserChatService],
})
export class UserChatModule {}
