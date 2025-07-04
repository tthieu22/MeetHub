import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Conversation, ConversationDocument } from '@api/modules/message/schema/conversations.schema';
import { Message, MessageDocument } from '@api/modules/message/schema/message.schema';
import { MessageReactions, MessageReactionsDocument } from '@api/modules/message/schema/message.reactions.schema';
import { MessageStatus, MessageStatusDocument } from '@api/modules/message/schema/message.status.schema';
import { BlockedUsers, BlockedUsersDocument } from '@api/modules/message/schema/blocked.users.schema';
import { ConversationMembers, ConversationMembersDocument } from '@api/modules/message/schema/conversation.members.schema';

@Injectable()
export class MessageService {
  constructor(
    @InjectModel(Conversation.name)
    private conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name)
    private messageModel: Model<MessageDocument>,
    @InjectModel(MessageReactions.name)
    private messageReactionsModel: Model<MessageReactionsDocument>,
    @InjectModel(MessageStatus.name)
    private messageStatusModel: Model<MessageStatusDocument>,
    @InjectModel(BlockedUsers.name)
    private blockedUsersModel: Model<BlockedUsersDocument>,
    @InjectModel(ConversationMembers.name)
    private conversationMembersModel: Model<ConversationMembersDocument>,
  ) {}
}
