import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  private transporter = nodemailer.createTransport({
    service: 'gmail',
    // host: 'smtp.gmail.com',
    // port: 465,
    // secure: true,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  async sendCode(email: string, code: string) {
    await this.transporter.sendMail({
      from: `"Xác thực tài khoản" <${process.env.MAIL_USER}>`,
      to: email,
      subject: 'Mã xác thực đăng ký',
      html: `<p>Mã xác nhận của bạn là: <b>${code}</b>. Có hiệu lực trong 5 phút.</p>`,
    });
  }
}
