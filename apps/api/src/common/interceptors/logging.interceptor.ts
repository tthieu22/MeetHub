import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

interface ErrorWithStatus {
  status?: number;
  message?: string;
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, ip } = request;
    const userAgent = request.get('User-Agent') || '';
    const startTime = Date.now();

    this.logger.log(`🚀 ${method} ${url} - ${ip} - ${userAgent}`);

    return next.handle().pipe(
      tap({
        next: () => {
          const endTime = Date.now();
          const duration = endTime - startTime;
          this.logger.log(`${method} ${url} - ${duration}ms`);
        },
        error: (error: ErrorWithStatus) => {
          const endTime = Date.now();
          const duration = endTime - startTime;
          const statusCode = error.status || 500;
          this.logger.error(`${method} ${url} - ${statusCode} - ${duration}ms - ${error.message}`);
        },
      }),
    );
  }
}
