import * as path from 'path';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '1h';
process.env.CACHE_TTL = '60';
process.env.RATE_LIMIT_WINDOW = '60000';
process.env.RATE_LIMIT_MAX = '1000';
process.env.USER_SERVICE_URL = 'http://localhost:3001';
process.env.ORDER_SERVICE_URL = 'http://localhost:3002';
process.env.PRODUCT_SERVICE_URL = 'http://localhost:3003';

jest.setTimeout(30000);

global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

require('tsconfig-paths').register({
  baseUrl: path.resolve(__dirname, '..'),
  paths: {
    '@/*': ['src/*'],
    '@common/*': ['src/common/*'],
    '@modules/*': ['src/modules/*'],
    '@business/*': ['src/business/*'],
    '@core/*': ['src/core/*'],
  },
});
