import { WebSocketGateway, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { ChatService } from '@api/gateway/chat.service';
import { WsAuthGuard } from '@api/common/guards/ws-auth.guard';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/',
  transports: ['websocket'],
})
@UseGuards(WsAuthGuard)
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor(private chatService: ChatService) {}

  afterInit(): void {}

  handleConnection(): void {}

  handleDisconnect(): void {}
}
