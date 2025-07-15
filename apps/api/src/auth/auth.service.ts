import { BadRequestException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '@api/modules/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import { comparePassword } from '@api/utils/brcrypt.password';

import { LoginResgisterService } from '@api/login-resgister/login-resgister.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private LoginResgisterService: LoginResgisterService,
  ) {}

  async signIn(email: string, pass: string, res: Response): Promise<any> {
    const user = await this.usersService.findOne(email);
    if (!user) throw new UnauthorizedException('Email không tồn tại');
    if (!user.isActive) throw new BadRequestException('Vui lòng xác thực email trước khi đăng nhập');
    const isMatch = await comparePassword(pass, user.password);
    if (!isMatch) throw new UnauthorizedException('Mật khẩu sai');

    const payload = { _id: String(user._id), name: user.name, role: user.role };
    const access_token = await this.jwtService.signAsync(payload, { expiresIn: '500m' });
    const refresh_token = await this.jwtService.signAsync(payload, { expiresIn: '7d' });

    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/auth/refresh-token',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { access_token };
  }

  async refreshToken(req: Request, res: Response) {
    const refresh_token = req.cookies?.refresh_token;
    if (!refresh_token) throw new ForbiddenException('Không có refresh token');

    try {
      const payload = await this.jwtService.verifyAsync(refresh_token);
      const newAccessToken = await this.jwtService.signAsync({ sub: payload.sub, name: payload.name, role: payload.role }, { expiresIn: '5m' });

      return res.json({ access_token: newAccessToken });
    } catch {
      throw new ForbiddenException('Refresh token không hợp lệ hoặc đã hết hạn');
    }
  }

  logout(res: Response) {
    res.clearCookie('refresh_token', {
      path: '/auth/refresh-token',
    });
    return { message: 'Đăng xuất thành công' };
  }

  async googleLogin(userProfile: any, res: Response) {
    const { email, name } = userProfile;

    let user = await this.usersService.findOne(email);
    if (!user) {
      user = await this.LoginResgisterService.register({
        email,
        name,
        password: 'google-auth',
      });
    }
    await this.usersService.activateUser(user.email);
    const payload = {
      _id: String(user._id),
      name: user.name,
      role: user.role || 'user', // mặc định hoặc lấy từ DB
    };

    const access_token = await this.jwtService.signAsync(payload, { expiresIn: '500m' });
    const refresh_token = await this.jwtService.signAsync(payload, { expiresIn: '7d' });

    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/auth/refresh-token',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Có thể redirect về FE và đính access_token
    // return res.json({ access_token });
    const FE_REDIRECT = `http://localhost:3000/login?access_token=${access_token}`;
    return res.redirect(FE_REDIRECT);
  }
}
