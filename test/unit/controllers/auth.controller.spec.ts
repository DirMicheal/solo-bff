import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '@/modules/auth/auth.controller';
import { AuthService } from '@/modules/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import {
  mockJwtService,
  createMockRequest,
  createTestToken,
  createTestUser,
} from 'test/utils/mock-utils';
import { ClientType } from '@/common/enums/index.enum';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: JwtService,
          useValue: mockJwtService(),
        },
        {
          provide: AuthService,
          useFactory: (jwtService) => new AuthService(jwtService),
          inject: [JwtService],
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService) as any;
  });

  describe('login', () => {
    it('should return token and user info on successful login', async () => {
      const req = createMockRequest({ clientType: ClientType.PC });
      const token = createTestToken();

      jest.spyOn(authService, 'generateToken').mockResolvedValue(token);

      const result = await controller.login(
        { username: 'testuser', password: 'password' },
        req,
      );

      expect(result.token).toBe(token);
      expect(result.user).toBeDefined();
      expect(result.user.username).toBe('testuser');
      expect(result.user.clientType).toBe(ClientType.PC);
      expect(authService.generateToken).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'testuser',
          clientType: ClientType.PC,
        }),
      );
    });

    it('should work with mini_program client type', async () => {
      const req = createMockRequest({ clientType: ClientType.MINI_PROGRAM });
      const token = createTestToken();

      jest.spyOn(authService, 'generateToken').mockResolvedValue(token);

      const result = await controller.login(
        { username: 'test', password: '123' },
        req,
      );

      expect(result.user.clientType).toBe(ClientType.MINI_PROGRAM);
    });
  });

  describe('getProfile', () => {
    it('should return current user info', async () => {
      const user = createTestUser();

      const result = await controller.getProfile(user);

      expect(result).toEqual(user);
    });
  });

  describe('refreshToken', () => {
    it('should return new token', async () => {
      const oldToken = createTestToken();
      const newToken = createTestToken();
      const req = createMockRequest({
        headers: { authorization: `Bearer ${oldToken}` },
      });

      jest.spyOn(authService, 'refreshToken').mockResolvedValue(newToken);

      const result = await controller.refreshToken(req);

      expect(result.token).toBe(newToken);
      expect(authService.refreshToken).toHaveBeenCalledWith(oldToken);
    });
  });
});
