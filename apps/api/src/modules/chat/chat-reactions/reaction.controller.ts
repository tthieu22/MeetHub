import { Controller } from '@nestjs/common';
import { ReactionService } from '@api/modules/chat/chat-reactions/reaction.service';

@Controller('messages')
export class ReactionController {
  constructor(private readonly reactionService: ReactionService) {}
}
