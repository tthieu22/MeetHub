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

  // CORS configuration for development
  const corsOrigins = configService.get<string>('CORS_ORIGINS')?.split(',') || ['http://localhost:3000'];
  const corsCredentials = configService.get<string>('CORS_CREDENTIALS') !== 'false';
  const corsMethods = configService.get<string>('CORS_METHODS')?.split(',') || ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];
  const corsAllowedHeaders = configService.get<string>('CORS_ALLOWED_HEADERS')?.split(',') || ['Content-Type', 'Authorization', 'X-Requested-With'];

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
        maxAge: 1000 * 60 * 60,
      },
    }),
  );
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.listen(port);
}
bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
