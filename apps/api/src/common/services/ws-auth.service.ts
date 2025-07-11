import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Socket } from 'socket.io';
import { WsUserPayload } from '../guards/ws-auth.guard';

@Injectable()
export class WsAuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateToken(client: Socket): Promise<WsUserPayload> {
    const token = this.extractToken(client);

    if (!token) {
      throw new Error('Token không tồn tại');
    }

    try {
      return await this.jwtService.verifyAsync<WsUserPayload>(token, { secret: this.configService.get<string>('SECRET_JWT') });
    } catch {
      throw new Error('Token không hợp lệ');
    }
  }

  private extractToken(client: Socket): string | undefined {
    return (client.handshake.auth.token as string) || (client.handshake.headers.authorization as string)?.replace('Bearer ', '');
  }
}
