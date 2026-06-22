import {
  BusinessException,
  ValidationException,
  UnauthorizedException,
  ForbiddenException,
  ServiceUnavailableException,
} from '@/common/exceptions/business.exception';
import { ErrorCode } from '@/common/enums/index.enum';
import { HttpStatus } from '@nestjs/common';

describe('Custom Exceptions', () => {
  describe('BusinessException', () => {
    it('should create BusinessException with default code', () => {
      const exception = new BusinessException('Business error occurred');

      expect(exception.getStatus()).toBe(HttpStatus.OK);
      const response = exception.getResponse() as any;
      expect(response.code).toBe(ErrorCode.BUSINESS_ERROR);
      expect(response.message).toBe('Business error occurred');
    });

    it('should create BusinessException with custom code', () => {
      const customCode = 2001;
      const exception = new BusinessException('Custom business error', customCode);

      const response = exception.getResponse() as any;
      expect(response.code).toBe(customCode);
      expect(response.message).toBe('Custom business error');
    });
  });

  describe('ValidationException', () => {
    it('should create ValidationException with message', () => {
      const exception = new ValidationException('Email is invalid');

      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      const response = exception.getResponse() as any;
      expect(response.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(response.message).toBe('Email is invalid');
      expect(response.data).toBeUndefined();
    });

    it('should create ValidationException with data', () => {
      const validationData = {
        fieldErrors: {
          email: 'Invalid email format',
          password: 'Password too short',
        },
      };
      const exception = new ValidationException('Validation failed', validationData);

      const response = exception.getResponse() as any;
      expect(response.data).toEqual(validationData);
    });
  });

  describe('UnauthorizedException', () => {
    it('should create UnauthorizedException with default message', () => {
      const exception = new UnauthorizedException();

      expect(exception.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
      const response = exception.getResponse() as any;
      expect(response.code).toBe(ErrorCode.UNAUTHORIZED);
      expect(response.message).toBe('Unauthorized');
    });

    it('should create UnauthorizedException with custom message', () => {
      const exception = new UnauthorizedException('Token expired');

      const response = exception.getResponse() as any;
      expect(response.message).toBe('Token expired');
    });
  });

  describe('ForbiddenException', () => {
    it('should create ForbiddenException with default message', () => {
      const exception = new ForbiddenException();

      expect(exception.getStatus()).toBe(HttpStatus.FORBIDDEN);
      const response = exception.getResponse() as any;
      expect(response.code).toBe(ErrorCode.FORBIDDEN);
      expect(response.message).toBe('Forbidden');
    });

    it('should create ForbiddenException with custom message', () => {
      const exception = new ForbiddenException('Access denied');

      const response = exception.getResponse() as any;
      expect(response.message).toBe('Access denied');
    });
  });

  describe('ServiceUnavailableException', () => {
    it('should create ServiceUnavailableException with service name', () => {
      const serviceName = 'user-service';
      const exception = new ServiceUnavailableException(serviceName);

      expect(exception.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
      const response = exception.getResponse() as any;
      expect(response.code).toBe(ErrorCode.SERVICE_UNAVAILABLE);
      expect(response.message).toContain(serviceName);
      expect(response.data.service).toBe(serviceName);
    });
  });
});
