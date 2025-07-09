// verify-reset-password.dto.ts
import { PasswordResetDto } from './create-password-reset.dto';
import { IsEmail, IsString, Length } from 'class-validator';

export class VerifyResetPasswordDto extends PasswordResetDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 6)
  code: string;
}
