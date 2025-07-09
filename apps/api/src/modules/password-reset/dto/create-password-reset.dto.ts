import { CreateUserDto } from '@api/modules/users/dto/create-user.dto';
import { PickType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class PasswordResetDto extends PickType(CreateUserDto, ['email'] as const) {
  @IsNotEmpty({ message: 'Password là bắt buộc' })
  @MinLength(5, {
    message: 'Password phải ít nhất 5 kí tự',
  })
  newPass: string;
  @IsString()
  newPassAgain: string;
}
