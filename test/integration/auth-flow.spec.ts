process.env.JWT_SECRET = 'bff-core-secret-key';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '@/app.module';
import { AuthService } from '@/modules/auth/auth.service';
import { GatewayService } from '@/modules/gateway/gateway.service';
import { CacheService } from '@/modules/cache/cache.service';
import { ClientType, ServiceName } from '@/common/enums/index.enum';
import { AllExceptionsFilter } from '@/common/filters/all-exceptions.filter';
import { TransformInterceptor } from '@/common/interceptors/transform.interceptor';
import { createTestUser } from 'test/utils/mock-utils';

describe('Auth Flow Integration', () => {
  let app: INestApplication;
  let authService: AuthService;
  let cacheService: CacheService;
  let gatewayService: GatewayService;

  beforeAll(async () => {
    process.env.USER_SERVICE_URL = 'http://localhost:3001';
    process.env.PRODUCT_SERVICE_URL = 'http://localhost:3002';
    process.env.ORDER_SERVICE_URL = 'http://localhost:3003';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalInterceptors(new TransformInterceptor());
    await app.init();

    authService = moduleFixture.get<AuthService>(AuthService);
    cacheService = moduleFixture.get<CacheService>(CacheService);
    gatewayService = moduleFixture.get<GatewayService>(GatewayService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await cacheService.reset();
    jest.clearAllMocks();
  });

  it('should login successfully and return token', async () => {
    const mockUser = {
      id: 'user-100',
      username: 'integration-user',
      nickname: 'Integration Test User',
      avatar: 'avatar.jpg',
      email: 'test@example.com',
    };

    jest.spyOn(gatewayService, 'post').mockResolvedValue(mockUser);

    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .set('X-Client-Type', ClientType.PC)
      .send({ username: 'integration-user', password: 'password123' })
      .expect(201);

    expect(response.body.code).toBe(0);
    expect(response.body.data.token).toBeDefined();
    expect(response.body.data.user.username).toBe('integration-user');
    expect(typeof response.body.data.token).toBe('string');
    expect(response.body.data.token.length).toBeGreaterThan(0);
  });

  it('should login with mini_program client type', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .set('X-Client-Type', ClientType.MINI_PROGRAM)
      .send({ username: 'mini-user', password: 'pass' })
      .expect(201);

    expect(response.body.data.user.clientType).toBe(ClientType.MINI_PROGRAM);
  });

  it('should reject access to protected endpoint without token', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/auth/profile')
      .expect(401);

    expect(response.body.code).not.toBe(0);
  });

  it('should reject access with invalid token', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/auth/profile')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);

    expect(response.body.code).not.toBe(0);
  });

  it('should access protected endpoint with valid token', async () => {
    const user = createTestUser();
    const token = await authService.generateToken({
      userId: user.userId,
      username: user.username,
      clientType: ClientType.PC,
    });

    const response = await request(app.getHttpServer())
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.code).toBe(0);
    expect(response.body.data.userId).toBe(user.userId);
    expect(response.body.data.username).toBe(user.username);
  });

  it('should refresh token with valid token', async () => {
    const user = createTestUser();
    const token = await authService.generateToken({
      userId: user.userId,
      username: user.username,
      clientType: ClientType.PC,
    });

    const response = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    expect(response.body.code).toBe(0);
    expect(response.body.data.token).toBeDefined();
    expect(typeof response.body.data.token).toBe('string');
    expect(response.body.data.token.length).toBeGreaterThan(0);
  });

  it('should access @SkipAuth endpoint without token', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/health/ping')
      .expect(200);

    expect(response.body.data).toBe('pong');
  });

  it('should get health check without auth', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/health')
      .expect(200);

    expect(response.body.code).toBe(0);
    expect(response.body.data.status).toBe('ok');
  });
});
