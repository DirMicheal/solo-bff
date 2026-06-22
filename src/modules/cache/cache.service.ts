import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CacheKeyPrefix } from '@/common/enums/index.enum';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.cacheManager.get<T>(key);
      return value || null;
    } catch (error) {
      this.logger.error(`Cache get error: ${error.message}`);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const options: any = {};
      if (ttl) {
        options.ttl = ttl;
      }
      await this.cacheManager.set(key, value, options);
    } catch (error) {
      this.logger.error(`Cache set error: ${error.message}`);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
    } catch (error) {
      this.logger.error(`Cache del error: ${error.message}`);
    }
  }

  async reset(): Promise<void> {
    try {
      await this.cacheManager.reset();
    } catch (error) {
      this.logger.error(`Cache reset error: ${error.message}`);
    }
  }

  async wrap<T>(
    key: string,
    fn: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const result = await fn();
    await this.set(key, result, ttl);
    return result;
  }

  buildKey(prefix: CacheKeyPrefix | string, ...parts: string[]): string {
    return `${prefix}${parts.join(':')}`;
  }

  async invalidatePattern(pattern: string): Promise<void> {
    this.logger.warn(
      'Pattern invalidation requires Redis. Falling back to reset for in-memory cache.',
    );
  }
}
