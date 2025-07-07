import { Controller } from '@nestjs/common';
import { ReactionService } from './reaction.service';

@Controller('messages')
export class ReactionController {
  constructor(private readonly reactionService: ReactionService) {}
}
