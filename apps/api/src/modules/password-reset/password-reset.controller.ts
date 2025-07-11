import { Controller, Post, Body } from '@nestjs/common';
import { PasswordResetService } from './password-reset.service';
import { LoginResgisterService } from '@api/login-resgister/login-resgister.service';
import { VerifyCodeType } from '@api/login-resgister/shemas/verify-code.schema';
import { SendCodeDto } from '@api/login-resgister/dto/send-code.dto';
import { VerifyResetPasswordDto } from './dto/VerifyResetPasswordDto';

@Controller('password-reset')
export class PasswordResetController {
  constructor(
    private readonly passwordResetService: PasswordResetService,
    private readonly loginRegisterService: LoginResgisterService,
  ) {}
  @Post('/sendcode')
  sendCodeForgotPassword(@Body() dtoEmail: SendCodeDto) {
    return this.loginRegisterService.sendVerificationCode(dtoEmail, VerifyCodeType.RESET_PASSWORD);
  }

  @Post('/verify')
  forgotPassword(@Body() dto: VerifyResetPasswordDto) {
    const verifyCodeDto = { email: dto.email, code: dto.code };
    return this.loginRegisterService.verifyCode(verifyCodeDto, VerifyCodeType.RESET_PASSWORD, dto);
  }
}
