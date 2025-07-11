import { Module } from '@nestjs/common';
import { LoginResgisterService } from './login-resgister.service';
import { LoginResgisterController } from './login-resgister.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '@api/modules/users/schema/user.schema';
import { MailerService } from './mailer.service';
import { VerifyCode, VerifyCodeSchema } from './shemas/verify-code.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]), MongooseModule.forFeature([{ name: VerifyCode.name, schema: VerifyCodeSchema }])],
  controllers: [LoginResgisterController],
  providers: [LoginResgisterService, MailerService],
  exports: [LoginResgisterService, MailerService],
})
export class LoginResgisterModule {}
