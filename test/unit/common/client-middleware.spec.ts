import { ClientMiddleware } from '@/common/middleware/client.middleware';
import { createMockRequest, createMockResponse } from 'test/utils/mock-utils';
import { ClientType } from '@/common/enums/index.enum';

describe('ClientMiddleware', () => {
  let middleware: ClientMiddleware;

  beforeEach(() => {
    middleware = new ClientMiddleware();
  });

  const testClientTypeDetection = (
    description: string,
    setupFn: () => any,
    expectedClientType: ClientType,
  ) => {
    it(description, () => {
      const req = setupFn();
      const res = createMockResponse();
      const next = jest.fn();

      middleware.use(req, res, next);

      expect(req.clientType).toBe(expectedClientType);
      expect(next).toHaveBeenCalled();
    });
  };

  testClientTypeDetection(
    'should detect PC from x-client-type header',
    () => createMockRequest({ headers: { 'x-client-type': 'pc' } }),
    ClientType.PC,
  );

  testClientTypeDetection(
    'should detect mini_program from x-client-type header',
    () => createMockRequest({ headers: { 'x-client-type': 'mini_program' } }),
    ClientType.MINI_PROGRAM,
  );

  testClientTypeDetection(
    'should detect app from x-client-type header',
    () => createMockRequest({ headers: { 'x-client-type': 'app' } }),
    ClientType.APP,
  );

  testClientTypeDetection(
    'should detect h5 from x-client-type header',
    () => createMockRequest({ headers: { 'x-client-type': 'h5' } }),
    ClientType.H5,
  );

  testClientTypeDetection(
    'should detect mini_program from WeChat User-Agent',
    () =>
      createMockRequest({
        headers: { 'user-agent': 'Mozilla/5.0 MicroMessenger/7.0.0' },
      }),
    ClientType.MINI_PROGRAM,
  );

  testClientTypeDetection(
    'should detect H5 from mobile User-Agent',
    () =>
      createMockRequest({
        headers: { 'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit Mobile/15E148' },
      }),
    ClientType.H5,
  );

  testClientTypeDetection(
    'should default to PC for unknown User-Agent',
    () =>
      createMockRequest({
        headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      }),
    ClientType.PC,
  );

  it('should set clientVersion from x-client-version header', () => {
    const req = createMockRequest({
      headers: {
        'x-client-type': 'app',
        'x-client-version': '2.5.0',
      },
    });
    const res = createMockResponse();
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(req.clientType).toBe(ClientType.APP);
    expect(req.clientVersion).toBe('2.5.0');
    expect(next).toHaveBeenCalled();
  });

  it('should prioritize x-client-type header over User-Agent', () => {
    const req = createMockRequest({
      headers: {
        'x-client-type': 'pc',
        'user-agent': 'Mozilla/5.0 MicroMessenger/7.0.0',
      },
    });
    const res = createMockResponse();
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(req.clientType).toBe(ClientType.PC);
  });
});
