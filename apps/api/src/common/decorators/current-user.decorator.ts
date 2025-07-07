import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest();
  // TODO: Extract user ID from JWT token
  // For now, return a mock user ID
  return (request.user?.sub as string) || 'mock-user-id';
});
