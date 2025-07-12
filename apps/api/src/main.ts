import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from '@api/app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { AllExceptionsFilter } from './modules/rooms/exception.filter';

import * as session from 'express-session';
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
  const sessionSecret = configService.get<string>('SESSION_SECRET');

  if (!sessionSecret) {
    console.warn('⚠️  SESSION_SECRET is not set! Using default secret for development only.');
  }

  app.setGlobalPrefix(apiPrefix);
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.use(cookieParser());
  app.use(
    session({
      secret: sessionSecret || 'default-secret-for-development',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 1000 * 60 * 60, // 1 giờ
      },
    }),
  );
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // <-- tự động loại field không có trong DTO
      forbidNonWhitelisted: true, // <-- nếu có field thừa thì báo lỗi
      transform: true,
    }),
  );
  await app.listen(port);
}
bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
