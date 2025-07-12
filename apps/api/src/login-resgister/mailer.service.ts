import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  constructor(private configService: ConfigService) {}

  private getTransporter() {
    return nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASS'),
      },
    });
  }

  async sendCode(email: string, code: string) {
    const transporter = this.getTransporter();
    await transporter.sendMail({
      from: `"Mã code từ" <${this.configService.get<string>('MAIL_USER')}>`,
      to: email,
      subject: 'Mã code xác thực',
      html: `<p>Mã xác nhận của bạn là: <b>${code}</b>. Có hiệu lực trong 5 phút.</p>`,
    });
  }
}
