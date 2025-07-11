import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest<Request>();
  const userId = request.user?._id;
  if (!userId) {
    throw new UnauthorizedException('User not authenticated');
  }
  return userId;
});
