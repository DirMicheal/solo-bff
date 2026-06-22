import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiResult } from '../dto/api-result.dto';
import { ErrorCode } from '../enums/index.enum';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = ErrorCode.SERVICE_ERROR;
    let message = 'Internal Server Error';
    let data: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        const res = exceptionResponse as any;
        message = res.message || exception.message;
        code = res.code !== undefined ? res.code : Number(ErrorCode.ERROR);
        data = res.data || null;
      } else {
        message = exception.message;
        code = Number(ErrorCode.ERROR);
      }

      const originalCode = typeof exceptionResponse === 'object' ? (exceptionResponse as any).code : undefined;

      if (status === HttpStatus.UNAUTHORIZED) {
        code = originalCode !== undefined ? originalCode : ErrorCode.UNAUTHORIZED;
        message = message || 'Unauthorized';
      } else if (status === HttpStatus.FORBIDDEN) {
        code = originalCode !== undefined ? originalCode : ErrorCode.FORBIDDEN;
        message = message || 'Forbidden';
      } else if (status === HttpStatus.NOT_FOUND) {
        code = originalCode !== undefined ? originalCode : ErrorCode.NOT_FOUND;
        message = message || 'Not Found';
      } else if (status === HttpStatus.BAD_REQUEST) {
        code = originalCode !== undefined ? originalCode : ErrorCode.VALIDATION_ERROR;
      } else if (status === HttpStatus.TOO_MANY_REQUESTS) {
        code = originalCode !== undefined ? originalCode : ErrorCode.RATE_LIMITED;
        message = 'Too Many Requests';
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(
        `Unhandled Exception: ${exception.message}`,
        exception.stack,
      );
    } else {
      this.logger.error(`Unknown Exception: ${JSON.stringify(exception)}`);
    }

    this.logger.warn(
      `[${request.method}] ${request.url} - ${status} - ${message}`,
    );

    response.status(status).json(ApiResult.fail(code, message, data));
  }
}
