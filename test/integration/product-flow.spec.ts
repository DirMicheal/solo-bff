process.env.JWT_SECRET = 'bff-core-secret-key';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '@/app.module';
import { AuthService } from '@/modules/auth/auth.service';
import { CacheService } from '@/modules/cache/cache.service';
import { GatewayService } from '@/modules/gateway/gateway.service';
import { ClientType } from '@/common/enums/index.enum';
import { ServiceName } from '@/common/enums/index.enum';
import { AllExceptionsFilter } from '@/common/filters/all-exceptions.filter';
import { TransformInterceptor } from '@/common/interceptors/transform.interceptor';
import { createTestUser } from 'test/utils/mock-utils';

describe('Product Flow Integration', () => {
  let app: INestApplication;
  let authService: AuthService;
  let cacheService: CacheService;
  let gatewayService: GatewayService;
  let token: string;
  let testUser: ReturnType<typeof createTestUser>;

  const mockProductData = {
    id: 'prod-integration-1',
    name: 'Integration Test Product',
    price: 199.99,
    originalPrice: 299.99,
    description: 'This is a product for integration testing',
    images: ['http://example.com/img1.jpg', 'http://example.com/img2.jpg'],
    stock: 100,
    category: { id: 'cat-1', name: 'Test Category' },
    createdAt: '2026-06-22T00:00:00.000Z',
  };

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

    testUser = createTestUser();
    token = await authService.generateToken({
      userId: testUser.userId,
      username: testUser.username,
      clientType: ClientType.PC,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  let requestSpy: jest.SpyInstance;

  beforeEach(async () => {
    await cacheService.reset();
    jest.restoreAllMocks();
    requestSpy = jest.spyOn(gatewayService, 'request');
  });

  it('should get health check', async () => {
    const response = await request(app.getHttpServer()).get('/api/health').expect(200);

    expect(response.body.code).toBe(0);
    expect(response.body.data.status).toBe('ok');
    expect(response.body.data.timestamp).toBeDefined();
  });

  it('should get ping response', async () => {
    const response = await request(app.getHttpServer()).get('/api/health/ping').expect(200);

    expect(response.body.data).toBe('pong');
  });

  it('should access products endpoint without auth (auth: false)', async () => {
    const mockListData = { list: [mockProductData], total: 1 };
    requestSpy.mockResolvedValue(mockListData);

    const response = await request(app.getHttpServer())
      .get('/api/products')
      .set('X-Client-Type', ClientType.PC)
      .expect(200);

    expect(response.body.code).toBe(0);
    expect(response.body.data.list).toBeDefined();
  });

  it('should get product detail without auth', async () => {
    requestSpy.mockResolvedValue(mockProductData);

    const response = await request(app.getHttpServer())
      .get('/api/products/detail/prod-integration-1')
      .set('X-Client-Type', ClientType.PC)
      .expect(200);

    expect(response.body.code).toBe(0);
    expect(response.body.data.name).toBe('Integration Test Product');
    expect(response.body.data.price).toBe(199.99);
  });

  it('should get full product info adapted for different clients', async () => {
    requestSpy.mockResolvedValue(mockProductData);

    const pcResponse = await request(app.getHttpServer())
      .get('/api/products/full/prod-integration-1')
      .set('X-Client-Type', ClientType.PC)
      .expect(200);

    expect(pcResponse.body.code).toBe(0);
    expect(pcResponse.body.data).toBeDefined();

    const miniResponse = await request(app.getHttpServer())
      .get('/api/products/full/prod-integration-1')
      .set('X-Client-Type', ClientType.MINI_PROGRAM)
      .expect(200);

    expect(miniResponse.body.code).toBe(0);
    expect(miniResponse.body.data).toBeDefined();
  });

  it('should get paginated product list', async () => {
    const mockListData = {
      list: [
        { id: 'prod-1', name: 'Product 1', price: 99.99 },
        { id: 'prod-2', name: 'Product 2', price: 199.99 },
      ],
      total: 20,
    };

    requestSpy.mockResolvedValue(mockListData);

    const response = await request(app.getHttpServer())
      .get('/api/products')
      .query({ page: 2, pageSize: 5 })
      .set('X-Client-Type', ClientType.PC)
      .expect(200);

    expect(response.body.code).toBe(0);
    expect(response.body.data.page).toBe(2);
    expect(response.body.data.pageSize).toBe(5);
    expect(response.body.data.list).toHaveLength(2);
  });
});
