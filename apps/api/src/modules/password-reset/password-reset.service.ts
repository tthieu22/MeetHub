import { Injectable } from '@nestjs/common';
import { PasswordResetDto } from './dto/create-password-reset.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class PasswordResetService {
  constructor(private UsersService: UsersService) {}
  forgotPassword(PasswordResetDto: PasswordResetDto) {
    try {
      const user = this.UsersService.findOne(PasswordResetDto.email);
    } catch (error) {
      throw error;
    }
  }
}
