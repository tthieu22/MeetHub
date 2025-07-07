import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res, UseGuards, Response as NestRes, Request as NestReq } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response, Request } from 'express';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('/signIn')
  signIn(@Body('email') email: string, @Body('password') password: string, @NestRes({ passthrough: true }) res: Response) {
    return this.authService.signIn(email, password, res);
  }

  @Post('refresh-token')
  refreshToken(@NestReq() req: Request, @NestRes({ passthrough: true }) res: Response) {
    return this.authService.refreshToken(req, res);
  }

  @Post('logout')
  logout(@NestRes({ passthrough: true }) res: Response) {
    return this.authService.logout(res);
  }

  @Get('/google')
  @UseGuards(AuthGuard('google'))
  async googleLogin() {
    // Tự động redirect tới Google
  }

  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))
  googleRedirect(@Req() req: Request, @Res() res: Response) {
    const userProfile = (req as any).user;
    console.log(userProfile);
    return this.authService.googleLogin(userProfile, res);
  }
}
