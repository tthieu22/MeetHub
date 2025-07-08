import { Controller, Post, Body } from '@nestjs/common';
import { PasswordResetService } from './password-reset.service';
import { PasswordResetDto } from './dto/create-password-reset.dto';

@Controller('password-reset')
export class PasswordResetController {
  constructor(private readonly passwordResetService: PasswordResetService) {}

  @Post()
  forgotPassword(@Body() PasswordResetDto: PasswordResetDto) {
    return this.passwordResetService.forgotPassword(PasswordResetDto);
  }
}
