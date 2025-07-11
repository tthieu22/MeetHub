import { IsBoolean, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { UserRole } from '../schema/user.schema';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @IsString({
    message: 'name phải là string',
  })
  @MaxLength(20, {
    message: 'Name chỉ tối đa 20 kí tự',
  })
  @MinLength(4, {
    message: 'Name phải ít nhất 4 kí tự',
  })
  @Matches(/^[a-zA-ZÀ-ỹ0-9\s]+$/, {
    message: 'Name chỉ được chứa chữ cái, số và khoảng trắng',
  })
  name: string;

  @IsNotEmpty({ message: 'Email là bắt buộc' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsNotEmpty({ message: 'Password là bắt buộc' })
  @MinLength(5, {
    message: 'Password phải ít nhất 5 kí tự',
  })
  password: string;

  @IsEnum(UserRole, { message: 'Vai trò không hợp lệ' })
  role: UserRole;

  @IsString()
  @IsOptional()
  avatarURL: string;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive: boolean;
}
