import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oidc';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleOidcStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL'),
      scope: ['openid', 'email', 'profile'],
    });
  }

  async validate(issuer: string, profile: any, done: Function): Promise<any> {
    const { displayName, emails, photos } = profile;
    const user = {
      email: emails?.[0]?.value,
      name: displayName,
      avatar: photos?.[0]?.value,
      provider: 'google',
    };
    done(null, user);
  }
}