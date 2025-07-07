import { Body, Controller, HttpCode, HttpStatus, Post, Request, Response } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response as Res, Request as Req } from 'express';
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('/signIn')
  signIn(@Body('email') email: string, @Body('password') password: string, @Response({ passthrough: true }) res: Res) {
    return this.authService.signIn(email, password, res);
  }
  @Post('refresh-token')
  refreshToken(@Request() req: Req, @Response({ passthrough: true }) res: Res) {
    return this.authService.refreshToken(req, res);
  }

  @Post('logout')
  logout(@Response({ passthrough: true }) res: Res) {
    return this.authService.logout(res);
  }
}
