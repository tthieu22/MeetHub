import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '@api/modules/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { RolesGuard } from './roles.guard';
import { GoogleOidcStrategy } from './strategies/google.strategy';
import { MailerService } from '@api/login-resgister/mailer.service';

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '7h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, RolesGuard, GoogleOidcStrategy, MailerService],
  exports: [JwtModule, AuthService],
})
export class AuthModule {}
