import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InvitationController } from './invitation.controller';
import { InvitationService } from './invitation.service';
import { Invitation, InvitationSchema } from './schema/invitation.schema';
import { Conversation, ConversationSchema } from '../chat-room/schema/chat-room.schema';
import { ConversationMember, ConversationMemberSchema } from '../chat-room/schema/conversation-member.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Invitation.name, schema: InvitationSchema },
      { name: Conversation.name, schema: ConversationSchema },
      { name: ConversationMember.name, schema: ConversationMemberSchema },
    ]),
  ],
  controllers: [InvitationController],
  providers: [InvitationService],
  exports: [InvitationService],
})
export class InvitationModule {}
