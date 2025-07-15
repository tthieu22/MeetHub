import { BadRequestException, Injectable } from '@nestjs/common';

import { RegisterDto } from './dto/register.dto';
import { hashPassword } from '@api/utils/brcrypt.password';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument, UserRole } from '@api/modules/users/schema/user.schema';
import { Model } from 'mongoose';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { SendCodeDto } from './dto/send-code.dto';
import { VerifyCode, VerifyCodeType } from '@api/login-resgister/shemas/verify-code.schema';
import { randomInt } from 'crypto';
import { MailerService } from '@api/login-resgister/mailer.service';
import { PasswordResetDto } from '@api/modules/password-reset/dto/create-password-reset.dto';

@Injectable()
export class LoginResgisterService {
  constructor(
    @InjectModel(User.name) private userDocumentModel: Model<UserDocument>,
    private mailerService: MailerService,

    @InjectModel(VerifyCode.name) private verifyCodeModel: Model<any>,
  ) {}

  async register(RegisterDto: RegisterDto) {
    try {
      const passwordBr = await hashPassword(RegisterDto.password);
      const user = new this.userDocumentModel({
        ...RegisterDto,
        password: passwordBr,
        role: UserRole.USER,
        isActive: false,
      });
      return await user.save();
    } catch (error) {
      if (error.code === 11000 && error.keyPattern?.email) {
        throw new BadRequestException('Email đã được sử dụng');
      }
      throw error;
    }
  }
  async sendVerificationCode(dto: SendCodeDto, type: VerifyCodeType) {
    const code = randomInt(100000, 999999).toString();

    await this.verifyCodeModel.findOneAndUpdate({ email: dto.email, type }, { code, createdAt: new Date() }, { upsert: true, new: true });

    await this.mailerService.sendCode(dto.email, code);

    return { sussess: true, message: 'Đã gửi mã xác thực về email' };
  }
  async verifyCode(dto: VerifyCodeDto, type: VerifyCodeType, ResetDto?: PasswordResetDto) {
    const record: VerifyCode | null = await this.verifyCodeModel.findOne({ email: dto.email, type });
    if (!record || record.code !== dto.code) {
      throw new BadRequestException('Mã xác thực không đúng hoặc đã hết hạn');
    }
    if (type === VerifyCodeType.VERIFY_ACCOUNT) {
      await this.activateAccount(dto.email);
    } else if (type === VerifyCodeType.RESET_PASSWORD) {
      if (!ResetDto) {
        throw new BadRequestException('Thiếu thông tin đặt lại mật khẩu');
      }
      await this.resetPassword(ResetDto);
    }

    return { success: true, message: 'Xác thực thành công' };
  }
  private async activateAccount(email: string) {
    await Promise.all([this.userDocumentModel.updateOne({ email }, { isActive: true }), this.verifyCodeModel.deleteMany({ email, type: VerifyCodeType.VERIFY_ACCOUNT })]);
  }
  private async resetPassword(ResetDto: PasswordResetDto) {
    if (!ResetDto.newPass) {
      throw new BadRequestException('Vui lòng cung cấp mật khẩu mới');
    }
    if (!ResetDto.newPassAgain) {
      throw new BadRequestException('Vui lòng nhập lại mật khẩu');
    }
    if (ResetDto.newPass != ResetDto.newPassAgain) {
      throw new BadRequestException('Vui lòng nhập lại giống mật khẩu đã nhập');
    }
    const hashed = await hashPassword(ResetDto.newPass);
    await Promise.all([
      this.userDocumentModel.updateOne({ email: ResetDto.email }, { password: hashed }),
      this.verifyCodeModel.deleteMany({ email: ResetDto.email, type: VerifyCodeType.RESET_PASSWORD }),
    ]);
  }
}
