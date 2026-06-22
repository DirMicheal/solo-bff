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

describe('Order Aggregation Integration', () => {
  let app: INestApplication;
  let authService: AuthService;
  let cacheService: CacheService;
  let gatewayService: GatewayService;
  let token: string;
  let testUser: ReturnType<typeof createTestUser>;

  const mockOrder = {
    id: 'order-int-1',
    userId: 'user-int-1',
    status: 'paid',
    totalAmount: 399.97,
    items: [
      { productId: 'prod-int-1', quantity: 1, price: 199.99 },
      { productId: 'prod-int-2', quantity: 2, price: 99.99 },
    ],
    createdAt: '2026-06-22T10:00:00.000Z',
  };

  const mockUser = {
    id: 'user-int-1',
    username: 'order-user',
    nickname: 'Order Test User',
    phone: '13800138000',
    avatar: 'avatar.jpg',
  };

  const mockProducts = [
    { id: 'prod-int-1', name: 'Product A', price: 199.99, images: ['imgA.jpg'] },
    { id: 'prod-int-2', name: 'Product B', price: 99.99, images: ['imgB.jpg'] },
  ];

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

    testUser = createTestUser({ userId: 'user-int-1', username: 'order-user' });
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

  it('should create new order and return order id', async () => {
    const createOrderDto = {
      items: [
        { productId: 'prod-int-1', quantity: 1 },
        { productId: 'prod-int-2', quantity: 2 },
      ],
    };

    const createdOrder = { ...mockOrder, id: 'new-order-1' };
    requestSpy.mockResolvedValue(createdOrder);

    const response = await request(app.getHttpServer())
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Client-Type', ClientType.PC)
      .send(createOrderDto)
      .expect(201);

    expect(response.body.code).toBe(0);
    expect(response.body.data.id).toBe('new-order-1');
    expect(response.body.data.status).toBe('paid');
  });

  it('should get order detail', async () => {
    requestSpy.mockImplementation(async (options: any) => {
        if (options.serviceName === ServiceName.ORDER && options.path.includes('/orders/')) {
          return mockOrder;
        }
        return null;
      });

    const response = await request(app.getHttpServer())
      .get('/api/orders/detail/order-int-1')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Client-Type', ClientType.PC)
      .expect(200);

    expect(response.body.code).toBe(0);
    expect(response.body.data.id).toBe('order-int-1');
    expect(response.body.data.status).toBe('paid');
  });

  it('should get order list for current user', async () => {
    const mockOrderList = {
      list: [
        { id: 'order-1', totalAmount: 199.99, status: 'paid' },
        { id: 'order-2', totalAmount: 299.99, status: 'pending' },
      ],
      total: 15,
    };

    requestSpy.mockResolvedValue(mockOrderList);

    const response = await request(app.getHttpServer())
      .get('/api/orders')
      .query({ page: 1, pageSize: 10 })
      .set('Authorization', `Bearer ${token}`)
      .set('X-Client-Type', ClientType.PC)
      .expect(200);

    expect(response.body.code).toBe(0);
    expect(response.body.data.list).toHaveLength(2);
    expect(response.body.data.total).toBe(15);
    expect(response.body.data.pageSize).toBe(10);
  });

  it('should get full aggregated order with user and product info', async () => {
    requestSpy.mockImplementation(async (options: any) => {
        if (options.serviceName === ServiceName.ORDER && options.path.includes('/orders/')) {
          return mockOrder;
        }
        if (options.serviceName === ServiceName.USER && options.path.includes('/users/')) {
          return mockUser;
        }
        if (options.serviceName === ServiceName.PRODUCT) {
          const prodId = options.path.split('/').pop();
          return mockProducts.find((p) => p.id === prodId);
        }
        return null;
      });

    const response = await request(app.getHttpServer())
      .get('/api/orders/full/order-int-1')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Client-Type', ClientType.PC)
      .expect(200);

    expect(response.body.code).toBe(0);
    expect(response.body.data.id).toBe('order-int-1');
  });
});
