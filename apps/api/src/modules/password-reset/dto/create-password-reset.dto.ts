import { CreateUserDto } from '@api/modules/users/dto/create-user.dto';
import { PickType } from '@nestjs/mapped-types';

export class PasswordResetDto extends PickType(CreateUserDto, ['password', 'email'] as const) {}
