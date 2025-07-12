import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { WsUserPayload } from '../guards/ws-auth.guard';

export const WsUser = createParamDecorator((data: keyof WsUserPayload | undefined, ctx: ExecutionContext): WsUserPayload | string => {
  const client = ctx.switchToWs().getClient<{ user: WsUserPayload }>();
  const user = client.user;

  return data ? user?.[data] : user;
});
