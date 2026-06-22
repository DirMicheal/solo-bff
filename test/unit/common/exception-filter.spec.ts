import { AllExceptionsFilter } from '@/common/filters/all-exceptions.filter';
import {
  HttpException,
  HttpStatus,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  createMockRequest,
  createMockResponse,
  createMockExecutionContext,
} from 'test/utils/mock-utils';
import { ErrorCode } from '@/common/enums/index.enum';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let mockResponse: any;
  let mockRequest: any;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    mockResponse = createMockResponse();
    mockRequest = createMockRequest({
      method: 'GET',
      url: '/api/test',
    });
  });

  const createContext = (exception: any) =>
    createMockExecutionContext({
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    });

  describe('HttpException handling', () => {
    it('should handle UnauthorizedException correctly', () => {
      const exception = new UnauthorizedException();

      filter.catch(exception, createContext(exception));

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: ErrorCode.UNAUTHORIZED,
          message: expect.any(String),
        }),
      );
    });

    it('should handle ForbiddenException correctly', () => {
      const exception = new ForbiddenException();

      filter.catch(exception, createContext(exception));

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: ErrorCode.FORBIDDEN,
        }),
      );
    });

    it('should handle NotFoundException correctly', () => {
      const exception = new NotFoundException('Resource not found');

      filter.catch(exception, createContext(exception));

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: ErrorCode.NOT_FOUND,
          message: 'Resource not found',
        }),
      );
    });

    it('should handle BadRequestException correctly', () => {
      const exception = new BadRequestException('Validation failed');

      filter.catch(exception, createContext(exception));

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Validation failed',
        }),
      );
    });

    it('should handle generic HttpException with object response', () => {
      const exception = new HttpException(
        { code: 1001, message: 'Custom error', data: { field: 'value' } },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, createContext(exception));

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 1001,
          message: 'Custom error',
          data: { field: 'value' },
        }),
      );
    });

    it('should handle Too Many Requests correctly', () => {
      const exception = new HttpException('Rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);

      filter.catch(exception, createContext(exception));

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.TOO_MANY_REQUESTS);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: ErrorCode.RATE_LIMITED,
          message: expect.any(String),
        }),
      );
    });
  });

  describe('Non-HttpException handling', () => {
    it('should handle Error objects', () => {
      const exception = new Error('Unexpected error');

      filter.catch(exception, createContext(exception));

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: ErrorCode.SERVICE_ERROR,
          message: 'Unexpected error',
        }),
      );
    });

    it('should handle unknown exceptions', () => {
      const exception = 'Some string error';

      filter.catch(exception, createContext(exception));

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: ErrorCode.SERVICE_ERROR,
          message: expect.any(String),
        }),
      );
    });
  });

  describe('response format', () => {
    it('should always return consistent response format', () => {
      const exception = new Error('Test error');

      filter.catch(exception, createContext(exception));

      const responseData = mockResponse.json.mock.calls[0][0];

      expect(responseData).toHaveProperty('code');
      expect(responseData).toHaveProperty('message');
      expect(responseData).toHaveProperty('data');
      expect(responseData).toHaveProperty('timestamp');
      expect(typeof responseData.timestamp).toBe('number');
    });
  });
});
