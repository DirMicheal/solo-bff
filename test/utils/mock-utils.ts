export type MockType<T> = {
  [P in keyof T]?: jest.Mock<unknown>;
};

export const createMock = <T>(methods?: Partial<Record<keyof T, jest.Mock>>): MockType<T> => {
  const mock: any = {};
  if (methods) {
    Object.assign(mock, methods);
  }
  return mock;
};

export const mockCacheManager = () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  reset: jest.fn(),
  store: {
    name: 'memory',
  },
});

export const mockJwtService = () => ({
  sign: jest.fn(),
  verify: jest.fn(),
  verifyAsync: jest.fn(),
  decode: jest.fn(),
});

export const mockReflector = () => ({
  getAllAndOverride: jest.fn(),
  get: jest.fn(),
});

export const mockGatewayService = () => ({
  request: jest.fn(),
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  getService: jest.fn(),
  registerService: jest.fn(),
});

export const mockCacheService = () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  reset: jest.fn(),
  wrap: jest.fn(),
  buildKey: jest.fn((prefix, ...parts) => `${prefix}${parts.join(':')}`),
  invalidatePattern: jest.fn(),
  invalidateByPrefix: jest.fn(),
});

export const mockAggregatorService = () => ({
  aggregate: jest.fn(),
  adaptFields: jest.fn((data) => data),
});

export const mockMultiEndService = () => ({
  getValue: jest.fn((config) => config?.default),
  adaptDataByClient: jest.fn((data) => data),
  registerAdapter: jest.fn(),
  getAdapter: jest.fn(),
  getPageConfig: jest.fn(() => ({ pageSize: 10, maxPageSize: 50 })),
});

export const mockPaginationService = () => ({
  normalizePagination: jest.fn((p) => ({
    page: p.page || 1,
    pageSize: p.pageSize || 10,
    skip: ((p.page || 1) - 1) * (p.pageSize || 10),
  })),
  buildPageResult: jest.fn((list, total, page, pageSize) => ({
    list,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  })),
  paginate: jest.fn(),
  toServiceParams: jest.fn(),
});

export const mockDiscoveryService = () => ({
  getControllers: jest.fn(() => []),
  getProviders: jest.fn(() => []),
});

export const mockMetadataScanner = () => ({
  getAllMethodNames: jest.fn(() => []),
  scanFromPrototype: jest.fn(() => []),
});

export const mockAuthService = () => ({
  generateToken: jest.fn(),
  verifyToken: jest.fn(),
  decodeToken: jest.fn(),
  refreshToken: jest.fn(),
});

export const createMockRequest = (overrides?: Partial<any>): any => ({
  headers: {},
  query: {},
  params: {},
  body: {},
  user: null,
  clientType: 'pc',
  clientVersion: '1.0.0',
  ip: '127.0.0.1',
  ...overrides,
});

export const createMockResponse = (): any => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
  send: jest.fn().mockReturnThis(),
  setHeader: jest.fn().mockReturnThis(),
});

export const createMockExecutionContext = (overrides?: Partial<any>): any => ({
  switchToHttp: jest.fn(() => ({
    getRequest: jest.fn(() => createMockRequest()),
    getResponse: jest.fn(() => createMockResponse()),
  })),
  getHandler: jest.fn(),
  getClass: jest.fn(),
  ...overrides,
});

export const createTestUser = (overrides?: Partial<any>) => ({
  id: '1',
  userId: '1',
  username: 'testuser',
  nickname: '测试用户',
  clientType: 'pc',
  roles: ['user'],
  ...overrides,
});

export const createTestToken = (): string => {
  return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature';
};

export const createMockProduct = (overrides?: Partial<any>) => ({
  id: '123',
  name: '测试商品',
  price: 99.99,
  originalPrice: 199.99,
  stock: 100,
  description: '这是一个测试商品',
  images: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
  categoryId: 'cat-001',
  sales: 1000,
  tags: ['热销', '新品'],
  ...overrides,
});

export const createMockOrder = (overrides?: Partial<any>) => ({
  id: 'order-123',
  orderNo: 'ORD202606220001',
  status: 1,
  totalAmount: 199.98,
  userId: '1',
  items: [
    { productId: '123', quantity: 2, price: 99.99 },
  ],
  createdAt: new Date().toISOString(),
  ...overrides,
});
