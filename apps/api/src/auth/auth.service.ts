import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '@api/modules/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import { comparePassword } from '@api/utils/brcrypt.password';

import { LoginResgisterService } from '@api/login-resgister/login-resgister.service';

interface GoogleUserProfile {
  email: string;
  name: string;
}

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
    const access_token = await this.jwtService.signAsync(payload, { expiresIn: '5m' });
    const refresh_token = await this.jwtService.signAsync(payload, { expiresIn: '7d' });

    console.log('Setting refresh token cookie for user:', user.email);
    console.log('Refresh token length:', refresh_token.length);

    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      sameSite: 'lax',
      path: '/', // Changed from '/auth/refresh-token' to '/'
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    console.log('Refresh token cookie set successfully');

    return {
      success: true,
      message: 'Đăng nhập thành công',
      data: { access_token },
    };
  }

  async refreshToken(req: Request, res: Response) {
    console.log('Refresh token request received');
    console.log('All cookies:', req.cookies);
    console.log('Refresh token cookie:', req.cookies?.refresh_token ? 'EXISTS' : 'NOT FOUND');

    const refresh_token = typeof req.cookies?.refresh_token === 'string' ? req.cookies.refresh_token : undefined;

    if (!refresh_token) {
      console.log('No refresh token in cookies');
      return res.json({
        success: false,
        message: 'Không có refresh token',
        data: null,
      });
    }

    try {
      interface JwtPayload {
        _id?: string;
        name?: string;
        role?: string;
        [key: string]: any;
      }
      const payload = await this.jwtService.verifyAsync<JwtPayload>(refresh_token);
      console.log('Refresh token verified, payload:', { _id: payload._id, name: payload.name, role: payload.role });

      // Tạo payload mới cho access token
      const newPayload = {
        _id: payload._id,
        name: payload.name,
        role: payload.role,
      };

      const newAccessToken = await this.jwtService.signAsync(newPayload, { expiresIn: '5m' });
      console.log('New access token generated');

      return res.json({
        success: true,
        message: 'Làm mới access token thành công',
        data: { access_token: newAccessToken },
      });
    } catch (error) {
      console.error('Refresh token error:', error);
      return res.json({
        success: false,
        message: 'Refresh token không hợp lệ hoặc đã hết hạn',
        data: null,
      });
    }
  }

  logout(res: Response) {
    res.clearCookie('refresh_token', {
      path: '/', // Changed from '/auth/refresh-token' to '/'
    });
    return { message: 'Đăng xuất thành công' };
  }

  async googleLogin(userProfile: any, res: Response) {
    const { email, name } = userProfile as GoogleUserProfile;

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

    const access_token = await this.jwtService.signAsync(payload, { expiresIn: '5m' });
    const refresh_token = await this.jwtService.signAsync(payload, { expiresIn: '7d' });

    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/', // Changed from '/auth/refresh-token' to '/'
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Có thể redirect về FE và đính access_token
    // return res.json({ access_token });
    const FE_REDIRECT = `http://localhost:3000/login?access_token=${access_token}`;
    return res.redirect(FE_REDIRECT);
  }
}
