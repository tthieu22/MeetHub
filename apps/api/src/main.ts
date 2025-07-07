import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from '@api/app.module';
import { ValidationPipe } from '@nestjs/common';
import { ResponseInterceptor } from '@api/common/interceptors/response.interceptor';
import { LoggingInterceptor } from '@api/common/interceptors/logging.interceptor';
import { HttpExceptionFilter } from '@api/common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const corsOrigins = configService.get<string>('CORS_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000').split(',');
  const corsCredentials = configService.get<boolean>('CORS_CREDENTIALS', true);
  const corsMethods = configService.get<string>('CORS_METHODS', 'GET,POST,PUT,DELETE,OPTIONS').split(',');
  const corsAllowedHeaders = configService.get<string>('CORS_ALLOWED_HEADERS', 'Content-Type,Authorization').split(',');

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
  app.useGlobalInterceptors(new ResponseInterceptor(), new LoggingInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/${apiPrefix}`);
}
bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
