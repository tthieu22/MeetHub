import { Controller } from '@nestjs/common';
import { MessageService } from '@api/modules/chat-message/message.service';

@Controller('message')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}
}
