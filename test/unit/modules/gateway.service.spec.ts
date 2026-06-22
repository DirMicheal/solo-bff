import { Test, TestingModule } from '@nestjs/testing';
import { GatewayService } from '@/modules/gateway/gateway.service';
import { ServiceName } from '@/common/enums/index.enum';

jest.mock('axios', () => ({
  create: jest.fn(() => ({
    request: jest.fn(),
  })),
}));

describe('GatewayService', () => {
  let service: GatewayService;

  beforeEach(async () => {
    process.env.USER_SERVICE_URL = 'http://user-service:3001';
    process.env.ORDER_SERVICE_URL = 'http://order-service:3002';
    process.env.PRODUCT_SERVICE_URL = 'http://product-service:3003';

    const module: TestingModule = await Test.createTestingModule({
      providers: [GatewayService],
    }).compile();

    service = module.get<GatewayService>(GatewayService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('service registration and retrieval', () => {
    it('should have default services registered', () => {
      expect(() => service.getService(ServiceName.USER)).not.toThrow();
      expect(() => service.getService(ServiceName.ORDER)).not.toThrow();
      expect(() => service.getService(ServiceName.PRODUCT)).not.toThrow();
    });

    it('should throw error for non-existent service', () => {
      expect(() => service.getService('non-existent-service')).toThrow(
        'Service non-existent-service not found',
      );
    });

    it('should register new service dynamically', () => {
      const serviceName = 'payment';
      const baseURL = 'http://payment-service:3004';

      service.registerService(serviceName, { baseURL });

      expect(() => service.getService(serviceName)).not.toThrow();
    });
  });

  describe('request method', () => {
    const mockServiceRequest = jest.fn();

    beforeEach(() => {
      service['services'].set(ServiceName.USER, {
        request: mockServiceRequest,
      } as any);
    });

    it('should make successful request and extract data from standard response', async () => {
      const mockResponse = {
        data: {
          code: 0,
          message: 'success',
          data: { id: '1', name: 'test' },
        },
        status: 200,
      };
      mockServiceRequest.mockResolvedValue(mockResponse);

      const result = await service.request({
        serviceName: ServiceName.USER,
        path: '/users/1',
        method: 'GET',
      });

      expect(result).toEqual({ id: '1', name: 'test' });
      expect(mockServiceRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/users/1',
          method: 'GET',
          timeout: 5000,
        }),
      );
    });

    it('should return fallback when service fails', async () => {
      const fallbackData = { id: 'fallback', name: 'Fallback User' };
      mockServiceRequest.mockRejectedValue(new Error('Connection refused'));

      const result = await service.request({
        serviceName: ServiceName.USER,
        path: '/users/1',
        method: 'GET',
        fallback: fallbackData,
      });

      expect(result).toEqual(fallbackData);
    });

    it('should pass params correctly for GET request', async () => {
      const mockResponse = { data: { code: 0, data: [] }, status: 200 };
      mockServiceRequest.mockResolvedValue(mockResponse);
      const params = { page: 1, pageSize: 10 };

      await service.request({
        serviceName: ServiceName.USER,
        path: '/users',
        method: 'GET',
        params,
      });

      expect(mockServiceRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          params,
        }),
      );
    });

    it('should pass data correctly for POST request', async () => {
      const mockResponse = { data: { code: 0, data: { id: '1' } }, status: 201 };
      mockServiceRequest.mockResolvedValue(mockResponse);
      const postData = { name: 'New User', email: 'test@example.com' };

      await service.request({
        serviceName: ServiceName.USER,
        path: '/users',
        method: 'POST',
        data: postData,
      });

      expect(mockServiceRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          data: postData,
        }),
      );
    });

    it('should handle non-standard response formats', async () => {
      const rawData = { id: '1', name: 'raw' };
      mockServiceRequest.mockResolvedValue({
        data: rawData,
        status: 200,
      });

      const result = await service.request({
        serviceName: ServiceName.USER,
        path: '/users/1',
        method: 'GET',
      });

      expect(result).toEqual(rawData);
    });

    it('should throw error when service returns error code', async () => {
      mockServiceRequest.mockResolvedValue({
        data: {
          code: 500,
          message: 'Internal server error',
          data: null,
        },
        status: 200,
      });

      await expect(
        service.request({
          serviceName: ServiceName.USER,
          path: '/users/1',
          method: 'GET',
        }),
      ).rejects.toThrow('Internal server error');
    });
  });

  describe('convenience methods (get, post, put, delete)', () => {
    beforeEach(() => {
      jest.spyOn(service, 'request').mockResolvedValue({ success: true });
    });

    it('get should call request with correct method', async () => {
      const result = await service.get(ServiceName.USER, '/users/1', { id: 1 });

      expect(service.request).toHaveBeenCalledWith(
        expect.objectContaining({
          serviceName: ServiceName.USER,
          path: '/users/1',
          method: 'GET',
          params: { id: 1 },
        }),
      );
      expect(result).toEqual({ success: true });
    });

    it('post should call request with correct method', async () => {
      const data = { name: 'test' };
      const result = await service.post(ServiceName.USER, '/users', data);

      expect(service.request).toHaveBeenCalledWith(
        expect.objectContaining({
          serviceName: ServiceName.USER,
          path: '/users',
          method: 'POST',
          data,
        }),
      );
      expect(result).toEqual({ success: true });
    });

    it('put should call request with correct method', async () => {
      const data = { name: 'updated' };
      const result = await service.put(ServiceName.USER, '/users/1', data);

      expect(service.request).toHaveBeenCalledWith(
        expect.objectContaining({
          serviceName: ServiceName.USER,
          path: '/users/1',
          method: 'PUT',
          data,
        }),
      );
      expect(result).toEqual({ success: true });
    });

    it('delete should call request with correct method', async () => {
      const result = await service.delete(ServiceName.USER, '/users/1');

      expect(service.request).toHaveBeenCalledWith(
        expect.objectContaining({
          serviceName: ServiceName.USER,
          path: '/users/1',
          method: 'DELETE',
        }),
      );
      expect(result).toEqual({ success: true });
    });
  });
});
