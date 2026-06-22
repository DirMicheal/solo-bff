import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../enums/index.enum';

export class BusinessException extends HttpException {
  constructor(message: string, code: number = ErrorCode.BUSINESS_ERROR) {
    super(
      {
        code,
        message,
        data: null,
      },
      HttpStatus.OK,
    );
  }
}

export class ValidationException extends HttpException {
  constructor(message: string, data?: any) {
    super(
      {
        code: ErrorCode.VALIDATION_ERROR,
        message,
        data,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class UnauthorizedException extends HttpException {
  constructor(message = 'Unauthorized') {
    super(
      {
        code: ErrorCode.UNAUTHORIZED,
        message,
        data: null,
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class ForbiddenException extends HttpException {
  constructor(message = 'Forbidden') {
    super(
      {
        code: ErrorCode.FORBIDDEN,
        message,
        data: null,
      },
      HttpStatus.FORBIDDEN,
    );
  }
}

export class ServiceUnavailableException extends HttpException {
  constructor(serviceName: string) {
    super(
      {
        code: ErrorCode.SERVICE_UNAVAILABLE,
        message: `Service ${serviceName} is unavailable`,
        data: { service: serviceName },
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}
