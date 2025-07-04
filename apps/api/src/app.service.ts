import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private configService: ConfigService) {}

  getHello(): string {
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    return `Hello World! Environment: ${nodeEnv}`;
  }

  getConfig(): object {
    return {
      port: this.configService.get<number>('PORT'),
      nodeEnv: this.configService.get<string>('NODE_ENV'),
      apiPrefix: this.configService.get<string>('API_PREFIX'),
    };
  }
}
