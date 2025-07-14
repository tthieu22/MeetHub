import { Module } from '@nestjs/common';
import { MessageModule } from './chat-message/message.module';
import { RoomModule } from './chat-room/room.module';
import { NotificationModule } from './chat-notification/notification.module';
import { UserChatModule } from './chat-user/user-chat.module';
import { ReactionModule } from './chat-reactions/reaction.module';
import { InvitationModule } from './chat-invitation/invitation.module';

@Module({
  imports: [MessageModule, RoomModule, NotificationModule, UserChatModule, ReactionModule, InvitationModule],
  exports: [MessageModule, RoomModule, NotificationModule, UserChatModule, ReactionModule, InvitationModule],
})
export class ChatModule {}
