import { AuthGuard } from '@/modules/auth/auth.guard';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import {
  createMockExecutionContext,
  createMockRequest,
  mockJwtService,
  mockReflector,
  createTestToken,
  createTestUser,
} from 'test/utils/mock-utils';
import { ClientType } from '@/common/enums/index.enum';
import { UnauthorizedException } from '@/common/exceptions/business.exception';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let jwtService: jest.Mocked<JwtService>;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    jwtService = mockJwtService() as any;
    reflector = mockReflector() as any;
    guard = new AuthGuard(jwtService, reflector);
  });

  describe('skip auth', () => {
    it('should allow access when @SkipAuth() is set on handler', async () => {
      reflector.getAllAndOverride.mockReturnValue(true);

      const context = createMockExecutionContext();
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(jwtService.verifyAsync).not.toHaveBeenCalled();
    });

    it('should allow access when @SkipAuth() is set on class', async () => {
      reflector.getAllAndOverride.mockReturnValue(true);

      const context = createMockExecutionContext();
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });
  });

  describe('token validation', () => {
    beforeEach(() => {
      reflector.getAllAndOverride.mockReturnValue(undefined);
    });

    it('should throw UnauthorizedException when no token provided', async () => {
      const request = createMockRequest();
      const context = createMockExecutionContext({
        switchToHttp: () => ({
          getRequest: () => request,
          getResponse: () => ({}),
        }),
      });

      await expect(guard.canActivate(context)).rejects.toThrow('Token is required');
    });

    it('should throw UnauthorizedException when invalid token provided', async () => {
      const request = createMockRequest({
        headers: { authorization: `Bearer ${createTestToken()}` },
      });
      const context = createMockExecutionContext({
        switchToHttp: () => ({
          getRequest: () => request,
          getResponse: () => ({}),
        }),
      });

      jwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await expect(guard.canActivate(context)).rejects.toThrow('Invalid token');
    });

    it('should set request.user when valid token provided', async () => {
      const user = createTestUser();
      const request = createMockRequest({
        headers: { authorization: `Bearer ${createTestToken()}` },
      });
      const context = createMockExecutionContext({
        switchToHttp: () => ({
          getRequest: () => request,
          getResponse: () => ({}),
        }),
      });

      jwtService.verifyAsync.mockResolvedValue(user);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(request.user).toEqual(user);
    });
  });

  describe('client type restriction', () => {
    const user = createTestUser();

    beforeEach(() => {
      reflector.getAllAndOverride.mockImplementation((key: string) => {
        if (key === 'client_types') {
          return [ClientType.PC];
        }
        return undefined;
      });
    });

    it('should allow access for allowed client type', async () => {
      const request = createMockRequest({
        headers: { authorization: `Bearer ${createTestToken()}` },
        clientType: ClientType.PC,
      });
      const context = createMockExecutionContext({
        switchToHttp: () => ({
          getRequest: () => request,
          getResponse: () => ({}),
        }),
      });

      jwtService.verifyAsync.mockResolvedValue(user);

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should throw UnauthorizedException for disallowed client type', async () => {
      const request = createMockRequest({
        headers: { authorization: `Bearer ${createTestToken()}` },
        clientType: ClientType.MINI_PROGRAM,
      });
      const context = createMockExecutionContext({
        switchToHttp: () => ({
          getRequest: () => request,
          getResponse: () => ({}),
        }),
      });

      jwtService.verifyAsync.mockResolvedValue(user);

      await expect(guard.canActivate(context)).rejects.toThrow("Client type 'mini_program' is not allowed");
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from Bearer scheme', () => {
      const request = createMockRequest({
        headers: { authorization: 'Bearer valid-token' },
      });
      const context = createMockExecutionContext({
        switchToHttp: () => ({
          getRequest: () => request,
          getResponse: () => ({}),
        }),
      });

      reflector.getAllAndOverride.mockReturnValue(undefined);
      jwtService.verifyAsync.mockResolvedValue(createTestUser());

      return guard.canActivate(context).then(() => {
        expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-token', expect.any(Object));
      });
    });

    it('should return undefined for non-Bearer scheme', () => {
      const request = createMockRequest({
        headers: { authorization: 'Basic some-token' },
      });
      const context = createMockExecutionContext({
        switchToHttp: () => ({
          getRequest: () => request,
          getResponse: () => ({}),
        }),
      });

      reflector.getAllAndOverride.mockReturnValue(undefined);

      return expect(guard.canActivate(context)).rejects.toThrow('Token is required');
    });
  });
});
