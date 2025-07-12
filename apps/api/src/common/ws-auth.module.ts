import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { WsAuthGuard } from './guards/ws-auth.guard';
import { WsAuthService } from './services/ws-auth.service';

@Module({
  imports: [
    JwtModule.register({ 
      signOptions: { expiresIn: '3000s' },
    }),
  ],
  providers: [WsAuthGuard, WsAuthService],
  exports: [WsAuthGuard, WsAuthService],
})
export class WsAuthModule {}
