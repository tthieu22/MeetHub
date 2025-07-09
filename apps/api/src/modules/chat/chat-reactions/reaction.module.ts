import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReactionController } from '@api/modules/chat/chat-reactions/reaction.controller';
import { ReactionService } from '@api/modules/chat/chat-reactions/reaction.service';
import { Reaction, ReactionSchema } from '@api/modules/chat/chat-reactions/schema/reaction.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Reaction.name, schema: ReactionSchema }])],
  controllers: [ReactionController],
  providers: [ReactionService],
  exports: [ReactionService],
})
export class ReactionModule {}
