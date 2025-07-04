import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Conversation, ConversationSchema } from '@api/modules/message/schema/conversations.schema';
import { MessageController } from '@api/modules/message/message.controller';
import { MessageService } from '@api/modules/message/message.service';
import { Message, MessageSchema } from '@api/modules/message/schema/message.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
    ]),
  ],
  controllers: [MessageController],
  providers: [MessageService],
})
export class MessageModule {}
