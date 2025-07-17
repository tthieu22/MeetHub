import { AuthenticatedSocket } from '@api/common/guards/ws-auth.guard';
import { WsResponse } from '@api/common/interfaces/ws-response.interface';

export function emitError(client: AuthenticatedSocket, code: string, message: string, event: string = 'error') {
  const response: WsResponse = {
    success: false,
    message,
    code,
  };
  client.emit(event, response);
}

export function validateClient(client: AuthenticatedSocket, event: string = 'error'): string | undefined {
  const userId = client.user?._id as string | undefined;
  if (!userId) {
    emitError(client, 'USER_INVALID', 'User không xác thực', event);
    return undefined;
  }
  return userId;
}
