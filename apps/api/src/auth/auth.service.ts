import { UsersService } from '@api/modules/users/users.service';
import { comparePassword } from '@api/utils/brcrypt.password';
import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signIn(email: string, pass: string, res: Response): Promise<any> {
    try {
      const user = await this.usersService.findOne(email);
      if (!user) {
        throw new UnauthorizedException('Email không tồn tại');
      }
      const isMatch = await comparePassword(pass, user?.password);
      if (!isMatch) {
        throw new UnauthorizedException('Mật khẩu sai');
      }
      const payload = { sub: String(user._id), name: user.name, role: user.role };
      const access_token = await this.jwtService.signAsync(payload, { expiresIn: '5m' });
      const refresh_token = await this.jwtService.signAsync(payload, { expiresIn: '7d' });
      res.cookie('refresh_token', refresh_token, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/auth/refresh-token',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      return {
        access_token: access_token,
      };
    } catch (error) {
      throw error;
    }
  }
  async refreshToken(req: Request, res: Response) {
    const cookies = req.cookies as { [key: string]: string } | undefined;
    const refresh_token: string | undefined = cookies?.refresh_token;

    if (!refresh_token) throw new ForbiddenException('Không có refresh token');

    try {
      const payload = await this.jwtService.verifyAsync<{ sub: string; name: string; role: string }>(refresh_token);

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
}
