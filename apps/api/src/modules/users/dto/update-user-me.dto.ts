// dto/update-me.dto.ts

import { PickType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

export class UpdateMeDto extends PickType(CreateUserDto, ['name', 'avatarURL']) {}
