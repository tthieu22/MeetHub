import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';

export interface WsUserPayload {
  sub: string;
  name: string;
  role: string;
}

export interface AuthenticatedSocket extends Socket {
  user: WsUserPayload;
}

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: AuthenticatedSocket = context.switchToWs().getClient<AuthenticatedSocket>();
    const token = this.extractTokenFromSocket(client);

    if (!token) {
      client.emit('auth_error', {
        success: false,
        message: 'Token không tồn tại',
        code: 'TOKEN_MISSING',
      });
      return false;
    }

    try {
      const payload = await this.jwtService.verifyAsync<WsUserPayload>(token, {
        secret: process.env.SECRET_JWT,
      });
      client.user = payload;
      return true;
    } catch {
      client.emit('auth_error', {
        success: false,
        message: 'Token không hợp lệ',
        code: 'TOKEN_INVALID',
      });
      return false;
    }
  }

  private extractTokenFromSocket(client: Socket): string | undefined {
    const token = (client.handshake.auth.token as string) || (client.handshake.headers.authorization as string)?.replace('Bearer ', '');
    return token;
  }
}
