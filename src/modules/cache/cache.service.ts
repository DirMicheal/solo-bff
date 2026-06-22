import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache, Store } from 'cache-manager';
import { CacheKeyPrefix } from '@/common/enums/index.enum';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private memoryKeySet: Set<string> = new Set();

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  private getStore(): Store {
    return (this.cacheManager as any).store;
  }

  private isRedisStore(): boolean {
    const store = this.getStore();
    const storeName = (store as any)?.name || (store as any)?.constructor?.name || '';
    return /redis/i.test(storeName) || typeof (store as any)?.keys === 'function';
  }

  async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.cacheManager.get<T>(key);
      this.logger.debug(`Cache GET: ${key} -> ${value !== null && value !== undefined ? 'HIT' : 'MISS'}`);
      return value !== undefined ? value : null;
    } catch (error: any) {
      this.logger.error(`Cache GET error for key '${key}': ${error.message}`);
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
      if (!this.isRedisStore()) {
        this.memoryKeySet.add(key);
      }
      this.logger.debug(`Cache SET: ${key} (ttl: ${ttl || 'default'})`);
    } catch (error: any) {
      this.logger.error(`Cache SET error for key '${key}': ${error.message}`);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      if (!this.isRedisStore()) {
        this.memoryKeySet.delete(key);
      }
      this.logger.debug(`Cache DEL: ${key}`);
    } catch (error: any) {
      this.logger.error(`Cache DEL error for key '${key}': ${error.message}`);
    }
  }

  async reset(): Promise<void> {
    try {
      await this.cacheManager.reset();
      if (!this.isRedisStore()) {
        this.memoryKeySet.clear();
      }
      this.logger.log('Cache RESET: All cache cleared');
    } catch (error: any) {
      this.logger.error(`Cache RESET error: ${error.message}`);
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
    const cleanPrefix = String(prefix).replace(/:+$/, '');
    const cleanParts = parts.filter((part) => part !== null && part !== undefined && part !== '');
    return cleanParts.length > 0 ? `${cleanPrefix}:${cleanParts.join(':')}` : cleanPrefix;
  }

  private patternToRegex(pattern: string): RegExp {
    const escaped = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    return new RegExp(`^${escaped}$`);
  }

  private async getRedisKeys(pattern: string): Promise<string[]> {
    const store = this.getStore() as any;
    if (typeof store.keys === 'function') {
      try {
        return await store.keys(pattern);
      } catch (e: any) {
        this.logger.warn(`Redis store.keys() failed: ${e.message}. Falling back to SCAN.`);
      }
    }

    if (typeof store.getClient === 'function') {
      try {
        const client = store.getClient();
        if (client && typeof client.scan === 'function') {
          const keys: string[] = [];
          let cursor = '0';
          do {
            const [nextCursor, batch] = await client.scan(
              cursor,
              'MATCH',
              pattern,
              'COUNT',
              '100',
            );
            keys.push(...batch);
            cursor = nextCursor;
          } while (cursor !== '0');
          return keys;
        }
      } catch (e: any) {
        this.logger.error(`Redis SCAN failed: ${e.message}`);
      }
    }

    return [];
  }

  private getMemoryKeys(pattern: string): string[] {
    const regex = this.patternToRegex(pattern);
    return Array.from(this.memoryKeySet).filter((key) => regex.test(key));
  }

  async invalidatePattern(pattern: string): Promise<number> {
    let deletedCount = 0;

    this.logger.log(`Invalidating cache keys matching pattern: ${pattern}`);

    try {
      let keys: string[];

      if (this.isRedisStore()) {
        this.logger.debug('Using Redis store for pattern invalidation');
        keys = await this.getRedisKeys(pattern);
      } else {
        this.logger.debug('Using in-memory store for pattern invalidation');
        keys = this.getMemoryKeys(pattern);
      }

      if (keys.length === 0) {
        this.logger.debug(`No keys found matching pattern: ${pattern}`);
        return 0;
      }

      this.logger.debug(`Found ${keys.length} keys matching pattern '${pattern}': ${keys.join(', ')}`);

      const deletePromises = keys.map((key) => this.del(key));
      await Promise.all(deletePromises);
      deletedCount = keys.length;

      this.logger.log(
        `Successfully invalidated ${deletedCount} cache keys matching pattern: ${pattern}`,
      );
    } catch (error: any) {
      this.logger.error(
        `Pattern invalidation failed for '${pattern}': ${error.message}`,
        error.stack,
      );
    }

    return deletedCount;
  }

  async invalidateByPrefix(prefix: CacheKeyPrefix | string): Promise<number> {
    return this.invalidatePattern(`${prefix}*`);
  }

  getKeyCount(): number {
    if (this.isRedisStore()) {
      this.logger.warn('getKeyCount() is not supported for Redis store');
      return -1;
    }
    return this.memoryKeySet.size;
  }

  getAllKeys(): string[] {
    if (this.isRedisStore()) {
      this.logger.warn('getAllKeys() is not supported for Redis store, use invalidatePattern instead');
      return [];
    }
    return Array.from(this.memoryKeySet);
  }
}
