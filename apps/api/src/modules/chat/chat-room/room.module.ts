import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Conversation, ConversationSchema } from './schema/chat-room.schema';
import { ConversationMember, ConversationMemberSchema } from './schema/conversation-member.schema';
import { Message, MessageSchema } from '../chat-message/schema/message.schema';
import { MessageStatus, MessageStatusSchema } from '../chat-message/schema/message-status.schema';
import { User, UserSchema } from '../users/schema/user.schema';
import { RoomController } from './room.controller';
import { RoomService } from './room.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: ConversationMember.name, schema: ConversationMemberSchema },
      { name: Message.name, schema: MessageSchema },
      { name: MessageStatus.name, schema: MessageStatusSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [RoomController],
  providers: [RoomService],
  exports: [RoomService],
})
export class RoomModule {}
