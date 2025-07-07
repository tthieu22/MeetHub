import { PickType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

export class RegisterDto extends PickType(CreateUserDto, ['name', 'email', 'password'] as const) {}
