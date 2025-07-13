import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BlockedUser, BlockedUserSchema } from './schema/user-chat-blocked.schema';
import { User, UserSchema } from '../../users/schema/user.schema';
import { UserChatController } from './user-chat.controller';
import { UserChatService } from './user-chat.service';
import { UserRelationshipService } from './user-relationship.service';
import { ConversationMember, ConversationMemberSchema } from '../chat-room/schema/conversation-member.schema';
import { Conversation, ConversationSchema } from '../chat-room/schema/chat-room.schema';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BlockedUser.name, schema: BlockedUserSchema },
      { name: User.name, schema: UserSchema },
      { name: ConversationMember.name, schema: ConversationMemberSchema },
      { name: Conversation.name, schema: ConversationSchema },
    ]),
  ],
  controllers: [UserChatController],
  providers: [UserChatService, UserRelationshipService],
  exports: [UserChatService],
})
export class UserChatModule {}
