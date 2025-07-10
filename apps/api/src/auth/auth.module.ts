import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '@api/modules/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { RolesGuard } from './roles.guard';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { GoogleOidcStrategy } from './strategies/google.strategy';
import { MailerService } from '../login-resgister/mailer.service';
import { MongooseModule } from '@nestjs/mongoose';
import { VerifyCode, VerifyCodeSchema } from '../login-resgister/shemas/verify-code.schema';
import { LoginResgisterModule } from '@api/login-resgister/login-resgister.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PassportModule,
    UsersModule,
    LoginResgisterModule,
    JwtModule.register({
      global: true,
      secret: process.env.SECRET_JWT,
      signOptions: { expiresIn: '1h' },
    }),
    MongooseModule.forFeature([{ name: VerifyCode.name, schema: VerifyCodeSchema }]),
  ],
  controllers: [AuthController],
  providers: [AuthService, RolesGuard, GoogleOidcStrategy, MailerService],
})
export class AuthModule {}
