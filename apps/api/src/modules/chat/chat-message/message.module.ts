import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Conversation, ConversationSchema } from '@api/modules/chat/chat-room/schema/chat-room.schema';
import { ConversationMember, ConversationMemberSchema } from '@api/modules/chat/chat-room/schema/conversation-member.schema';
import { MessageController } from '@api/modules/chat/chat-message/message.controller';
import { MessageService } from '@api/modules/chat/chat-message/message.service';
import { Message, MessageSchema } from '@api/modules/chat/chat-message/schema/message.schema';
import { MessageStatus, MessageStatusSchema } from '@api/modules/chat/chat-message/schema/message-status.schema';
import { User, UserSchema } from '@api/modules/users/schema/user.schema';
import { UploadImageModule } from '@api/modules/upload/upload.module';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: ConversationMember.name, schema: ConversationMemberSchema },
      { name: Message.name, schema: MessageSchema },
      { name: MessageStatus.name, schema: MessageStatusSchema },
      { name: User.name, schema: UserSchema },
    ]),
    UploadImageModule,
  ],
  controllers: [MessageController],
  providers: [MessageService],
  exports: [MessageService],
})
export class MessageModule {}
