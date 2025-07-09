import { BadRequestException, Injectable } from '@nestjs/common';

import { RegisterDto } from './dto/register.dto';
import { hashPassword } from '@api/utils/brcrypt.password';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument, UserRole } from '@api/modules/users/schema/user.schema';
import { Model } from 'mongoose';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { SendCodeDto } from './dto/send-code.dto';
import { VerifyCode } from '@api/login-resgister/shemas/verify-code.schema';
import { randomInt } from 'crypto';
import { MailerService } from '@api/login-resgister/mailer.service';

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
  async sendVerificationCode(dto: SendCodeDto) {
    const code = randomInt(100000, 999999).toString();

    await this.verifyCodeModel.findOneAndUpdate({ email: dto.email }, { code, createdAt: new Date() }, { upsert: true, new: true });

    await this.mailerService.sendCode(dto.email, code);

    return { sussess: true, message: 'Đã gửi mã xác thực về email' };
  }
  async verifyCode(dto: VerifyCodeDto) {
    const record: VerifyCode | null = await this.verifyCodeModel.findOne({ email: dto.email });
    if (!record || record.code !== dto.code) {
      throw new BadRequestException('Mã xác thực không đúng hoặc đã hết hạn');
    }
    await Promise.all([this.userDocumentModel.updateOne({ email: dto.email }, { isActive: true }), this.verifyCodeModel.deleteMany({ email: dto.email })]);

    return { sussess: true, message: 'Xác thực thành công' };
  }
}
