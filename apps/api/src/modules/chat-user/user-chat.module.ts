import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BlockedUser, BlockedUserSchema } from './schema/user-chat-blocked.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: BlockedUser.name, schema: BlockedUserSchema }])],
  providers: [],
  exports: [],
})
export class UserChatModule {}
