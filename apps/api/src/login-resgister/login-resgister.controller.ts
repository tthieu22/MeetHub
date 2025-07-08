import { Controller, Post, Body } from '@nestjs/common';
import { LoginResgisterService } from './login-resgister.service';

import { RegisterDto } from './dto/register.dto';
import { SendCodeDto } from './dto/send-code.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';

@Controller('redirect')
export class LoginResgisterController {
  constructor(private readonly loginResgisterService: LoginResgisterService) {}

  @Post('/register')
  register(@Body() RegisterDto: RegisterDto) {
    return this.loginResgisterService.register(RegisterDto);
  }
  @Post('send-code')
  sendCode(@Body() dto: SendCodeDto) {
    return this.loginResgisterService.sendVerificationCode(dto);
  }

  @Post('verify-code')
  verifyCode(@Body() dto: VerifyCodeDto) {
    return this.loginResgisterService.verifyCode(dto);
  }
}
