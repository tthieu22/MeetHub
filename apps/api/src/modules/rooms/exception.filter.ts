import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

        let message = 'Internal server error';
        let errors: any[] = [];

        if (exception instanceof HttpException) {
            const exceptionResponse = exception.getResponse();
            if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
                message  = (exceptionResponse as any).message || message;
                errors = (exceptionResponse as any).errors || errors;
            } else {
                message = exceptionResponse as string;
            }
        }

        response.status(status).json({
            success: false,
            message,
            errors,
        });
    }
}