import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from '@api/app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const corsOrigins = configService.get<string>('CORS_ORIGINS')?.split(',');
  const corsCredentials = configService.get<boolean>('CORS_CREDENTIALS');
  const corsMethods = configService.get<string>('CORS_METHODS')?.split(',');
  const corsAllowedHeaders = configService.get<string>('CORS_ALLOWED_HEADERS')?.split(',');

  app.enableCors({
    origin: corsOrigins,
    credentials: corsCredentials,
    methods: corsMethods,
    allowedHeaders: corsAllowedHeaders,
  });

  const port = configService.get<number>('PORT', 8000);
  const apiPrefix = configService.get<string>('API_PREFIX', 'api');
  app.setGlobalPrefix(apiPrefix);
  app.useGlobalPipes(new ValidationPipe());
  app.use(cookieParser());
  await app.listen(port);
}
bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
