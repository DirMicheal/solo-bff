import { Test, TestingModule } from '@nestjs/testing';
import { MultiEndService } from '@/modules/multi-end/multi-end.service';
import { ClientType } from '@/common/enums/index.enum';
import { FieldAdapterConfig } from '@/modules/aggregator/aggregator.service';

describe('MultiEndService', () => {
  let service: MultiEndService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MultiEndService],
    }).compile();

    service = module.get<MultiEndService>(MultiEndService);
  });

  describe('getValue', () => {
    it('should return value for specific client type', () => {
      const config = {
        [ClientType.PC]: { pageSize: 20 },
        [ClientType.MINI_PROGRAM]: { pageSize: 10 },
      };

      expect(service.getValue(config, ClientType.PC)).toEqual({ pageSize: 20 });
      expect(service.getValue(config, ClientType.MINI_PROGRAM)).toEqual({ pageSize: 10 });
    });

    it('should return default value when client type not found', () => {
      const config = {
        [ClientType.PC]: { pageSize: 20 },
        default: { pageSize: 10 },
      };

      expect(service.getValue(config, ClientType.APP)).toEqual({ pageSize: 10 });
    });

    it('should return undefined when no match and no default', () => {
      const config = {
        [ClientType.PC]: { pageSize: 20 },
      };

      expect(service.getValue(config, ClientType.APP)).toBeUndefined();
    });

    it('should return undefined when config is null/undefined', () => {
      expect(service.getValue(null as any, ClientType.PC)).toBeUndefined();
      expect(service.getValue(undefined as any, ClientType.PC)).toBeUndefined();
    });
  });

  describe('adaptDataByClient', () => {
    const mockData = {
      id: '1',
      username: 'testuser',
      nickname: '测试用户',
      avatar: 'avatar.jpg',
      email: 'test@example.com',
      phone: '13800138000',
      level: 5,
      vipLevel: 2,
    };

    const mockAdapterService = {
      adaptFields: jest.fn((data) => ({ ...data, adapted: true })),
    };

    beforeEach(() => {
      mockAdapterService.adaptFields.mockClear();
    });

    it('should return data as-is when fieldAdapters is undefined', () => {
      const result = service.adaptDataByClient(
        mockData,
        undefined as any,
        ClientType.PC,
        mockAdapterService,
      );

      expect(result).toEqual(mockData);
      expect(mockAdapterService.adaptFields).not.toHaveBeenCalled();
    });

    it('should return data as-is when no adapter config for client', () => {
      const fieldAdapters = {
        [ClientType.PC]: { include: ['id', 'name'] },
      };

      const result = service.adaptDataByClient(
        mockData,
        fieldAdapters,
        ClientType.MINI_PROGRAM,
        mockAdapterService,
      );

      expect(result).toEqual(mockData);
      expect(mockAdapterService.adaptFields).not.toHaveBeenCalled();
    });

    it('should return data as-is when adapterService is invalid', () => {
      const fieldAdapters = {
        [ClientType.PC]: { include: ['id'] },
      };

      const result = service.adaptDataByClient(
        mockData,
        fieldAdapters,
        ClientType.PC,
        null as any,
      );

      expect(result).toEqual(mockData);
    });

    it('should call adapterService with correct config for PC', () => {
      const pcConfig: FieldAdapterConfig = { include: ['id', 'username', 'email'] };
      const fieldAdapters = {
        [ClientType.PC]: pcConfig,
      };

      service.adaptDataByClient(
        mockData,
        fieldAdapters,
        ClientType.PC,
        mockAdapterService,
      );

      expect(mockAdapterService.adaptFields).toHaveBeenCalledWith(
        mockData,
        pcConfig,
        ClientType.PC,
      );
    });

    it('should use default config when specific client config not found', () => {
      const defaultConfig: FieldAdapterConfig = { include: ['id', 'nickname'] };
      const fieldAdapters = {
        default: defaultConfig,
      };

      service.adaptDataByClient(
        mockData,
        fieldAdapters,
        ClientType.MINI_PROGRAM,
        mockAdapterService,
      );

      expect(mockAdapterService.adaptFields).toHaveBeenCalledWith(
        mockData,
        defaultConfig,
        ClientType.MINI_PROGRAM,
      );
    });

    it('should return data as-is when adaptation throws error', () => {
      const fieldAdapters = {
        [ClientType.PC]: { include: ['id'] },
      };
      const errorService = {
        adaptFields: jest.fn(() => {
          throw new Error('Adaptation failed');
        }),
      };

      const result = service.adaptDataByClient(
        mockData,
        fieldAdapters,
        ClientType.PC,
        errorService,
      );

      expect(result).toEqual(mockData);
    });
  });

  describe('getPageConfig', () => {
    it('should return correct defaults for PC', () => {
      const config = service.getPageConfig(ClientType.PC);
      expect(config.pageSize).toBe(20);
      expect(config.maxPageSize).toBe(100);
    });

    it('should return correct defaults for mini_program', () => {
      const config = service.getPageConfig(ClientType.MINI_PROGRAM);
      expect(config.pageSize).toBe(10);
      expect(config.maxPageSize).toBe(50);
    });

    it('should return correct defaults for APP', () => {
      const config = service.getPageConfig(ClientType.APP);
      expect(config.pageSize).toBe(15);
      expect(config.maxPageSize).toBe(50);
    });

    it('should return correct defaults for H5', () => {
      const config = service.getPageConfig(ClientType.H5);
      expect(config.pageSize).toBe(10);
      expect(config.maxPageSize).toBe(30);
    });

    it('should use custom config when provided', () => {
      const customConfig = {
        [ClientType.PC]: { pageSize: 50, maxPageSize: 200 },
      };

      const config = service.getPageConfig(ClientType.PC, customConfig);
      expect(config.pageSize).toBe(50);
      expect(config.maxPageSize).toBe(200);
    });

    it('should use custom default when client type not found', () => {
      const customConfig = {
        default: { pageSize: 15, maxPageSize: 60 },
      };

      const config = service.getPageConfig(ClientType.H5, customConfig);
      expect(config.pageSize).toBe(15);
      expect(config.maxPageSize).toBe(60);
    });
  });

  describe('registerAdapter and getAdapter', () => {
    it('should register and get adapter', () => {
      const endpoint = '/api/users/:id';
      const config = {
        fieldAdapters: {
          [ClientType.PC]: { include: ['id', 'name'] },
        },
      };

      service.registerAdapter(endpoint, config);
      const retrieved = service.getAdapter(endpoint);

      expect(retrieved).toEqual(config);
    });

    it('should return undefined for non-existent adapter', () => {
      const retrieved = service.getAdapter('/non/existent');
      expect(retrieved).toBeUndefined();
    });
  });
});
