import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from '@/modules/cache/cache.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CacheKeyPrefix } from '@/common/enums/index.enum';

jest.mock('cache-manager', () => ({
  Cache: jest.fn(),
}));

describe('CacheService', () => {
  let service: CacheService;
  let cacheManager: any;
  const memoryStore = {
    name: 'memory',
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    reset: jest.fn(),
  };

  beforeEach(async () => {
    cacheManager = {
      store: memoryStore,
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      reset: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: CACHE_MANAGER,
          useValue: cacheManager,
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('get', () => {
    it('should return cached value', async () => {
      const key = 'test-key';
      const value = { id: '1', name: 'test' };
      cacheManager.get.mockResolvedValue(value);

      const result = await service.get(key);

      expect(result).toEqual(value);
      expect(cacheManager.get).toHaveBeenCalledWith(key);
    });

    it('should return null when cache miss', async () => {
      cacheManager.get.mockResolvedValue(undefined);

      const result = await service.get('non-existent-key');

      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      cacheManager.get.mockRejectedValue(new Error('Cache error'));

      const result = await service.get('error-key');

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should set cache value without ttl', async () => {
      const key = 'test-key';
      const value = { data: 'test' };

      await service.set(key, value);

      expect(cacheManager.set).toHaveBeenCalledWith(key, value, {});
    });

    it('should set cache value with ttl', async () => {
      const key = 'test-key';
      const value = { data: 'test' };
      const ttl = 300;

      await service.set(key, value, ttl);

      expect(cacheManager.set).toHaveBeenCalledWith(key, value, { ttl });
    });

    it('should track key for memory store', async () => {
      await service.set('key1', 'value1');
      await service.set('key2', 'value2');

      expect(service.getKeyCount()).toBe(2);
      expect(service.getAllKeys()).toContain('key1');
      expect(service.getAllKeys()).toContain('key2');
    });

    it('should not track key for redis store', async () => {
      const redisStore = {
        ...memoryStore,
        name: 'redis',
        keys: jest.fn(),
      };
      const redisCacheManager = {
        ...cacheManager,
        store: redisStore,
      };
      const redisService = new CacheService(redisCacheManager as any);

      await redisService.set('redis-key', 'value');

      expect(redisService.getKeyCount()).toBe(-1);
    });
  });

  describe('del', () => {
    it('should delete cache key', async () => {
      const key = 'test-key';

      await service.del(key);

      expect(cacheManager.del).toHaveBeenCalledWith(key);
    });

    it('should remove key from tracking for memory store', async () => {
      await service.set('temp-key', 'value');
      expect(service.getKeyCount()).toBe(1);

      await service.del('temp-key');
      expect(service.getKeyCount()).toBe(0);
    });
  });

  describe('reset', () => {
    it('should clear all cache', async () => {
      await service.set('key1', 'value1');
      await service.set('key2', 'value2');

      await service.reset();

      expect(cacheManager.reset).toHaveBeenCalled();
      expect(service.getKeyCount()).toBe(0);
    });
  });

  describe('wrap', () => {
    it('should return cached value if exists', async () => {
      const key = 'wrap-key';
      const cachedValue = { id: 'cached' };
      cacheManager.get.mockResolvedValue(cachedValue);

      const fn = jest.fn().mockResolvedValue({ id: 'new' });
      const result = await service.wrap(key, fn);

      expect(result).toEqual(cachedValue);
      expect(fn).not.toHaveBeenCalled();
      expect(cacheManager.set).not.toHaveBeenCalled();
    });

    it('should call fn and cache result on cache miss', async () => {
      const key = 'wrap-key-miss';
      const newValue = { id: 'new' };
      cacheManager.get.mockResolvedValue(undefined);

      const fn = jest.fn().mockResolvedValue(newValue);
      const result = await service.wrap(key, fn, 300);

      expect(result).toEqual(newValue);
      expect(fn).toHaveBeenCalled();
      expect(cacheManager.set).toHaveBeenCalledWith(key, newValue, { ttl: 300 });
    });

    it('should propagate errors from fn', async () => {
      const key = 'wrap-key-error';
      cacheManager.get.mockResolvedValue(undefined);

      const error = new Error('Function failed');
      const fn = jest.fn().mockRejectedValue(error);

      await expect(service.wrap(key, fn)).rejects.toThrow(error);
    });
  });

  describe('buildKey', () => {
    it('should build key with prefix and parts', () => {
      const key = service.buildKey(CacheKeyPrefix.USER, '1', 'profile');
      expect(key).toBe('user:1:profile');
    });

    it('should build key with string prefix', () => {
      const key = service.buildKey('custom', 'part1', 'part2');
      expect(key).toBe('custom:part1:part2');
    });
  });

  describe('invalidatePattern (memory store)', () => {
    beforeEach(async () => {
      await service.set('user:1:profile', { id: 1 });
      await service.set('user:2:profile', { id: 2 });
      await service.set('product:1:detail', { id: 1 });
      await service.set('order:123', { id: 123 });
    });

    it('should invalidate keys matching prefix pattern', async () => {
      const deletedCount = await service.invalidatePattern('user:*');

      expect(deletedCount).toBe(2);
      expect(service.getAllKeys()).toEqual(['product:1:detail', 'order:123']);
    });

    it('should invalidate keys matching exact pattern', async () => {
      const deletedCount = await service.invalidatePattern('order:123');

      expect(deletedCount).toBe(1);
      expect(service.getAllKeys()).not.toContain('order:123');
    });

    it('should return 0 when no keys match pattern', async () => {
      const deletedCount = await service.invalidatePattern('non-existent:*');

      expect(deletedCount).toBe(0);
    });

    it('should invalidate by prefix helper', async () => {
      const deletedCount = await service.invalidateByPrefix(CacheKeyPrefix.USER);

      expect(deletedCount).toBe(2);
    });
  });

  describe('Redis store detection', () => {
    it('should detect redis store by name', () => {
      const redisService = new CacheService({
        store: { name: 'redis' },
      } as any);

      expect((redisService as any).isRedisStore()).toBe(true);
    });

    it('should detect redis store by keys function', () => {
      const redisService = new CacheService({
        store: { keys: jest.fn() },
      } as any);

      expect((redisService as any).isRedisStore()).toBe(true);
    });

    it('should not detect memory store as redis', () => {
      expect((service as any).isRedisStore()).toBe(false);
    });
  });
});
