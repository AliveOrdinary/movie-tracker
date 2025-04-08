// src/common/services/cache.service.ts
import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../modules/cache/redis.service';
import { CacheTTL, EntityCacheTTL } from '../constants/cache-ttl.constants';
import { CacheKeyFactory } from '../factories/cache-key.factory';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly prefix: string;
  private readonly defaultTtl: number;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: ConfigService,
    private redisService: RedisService,
    protected readonly cacheKeyFactory: CacheKeyFactory,
  ) {
    this.prefix = this.configService.get('CACHE_PREFIX', 'app');
    this.defaultTtl = this.configService.get('CACHE_TTL', CacheTTL.MEDIUM);
  }

  private generateKey(key: string): string {
    // For backward compatibility
    if (key.includes(':')) {
      // Assume this is already using domain:action:id format, just add prefix
      return `${this.prefix}:${key}`;
    }
    
    // If it's a simple key, use it as is
    return `${this.prefix}:${key}`;
  }

  /**
   * Get a value from cache
   * @param key Cache key
   * @returns Cached value or null if not found
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const fullKey = this.generateKey(key);
      return await this.cacheManager.get<T>(fullKey);
    } catch (error) {
      this.logger.error(`Error getting cache key ${key}: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Get multiple values from cache
   * @param keys Array of cache keys
   * @returns Array of cached values or null if not found
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const fullKeys = keys.map(key => this.generateKey(key));
      return await Promise.all(
        fullKeys.map(key => this.cacheManager.get<T>(key))
      );
    } catch (error) {
      this.logger.error(`Error getting multiple cache keys: ${error.message}`, error.stack);
      return Array(keys.length).fill(null);
    }
  }

  /**
   * Set a value in cache
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Time-to-live in seconds (optional)
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const fullKey = this.generateKey(key);
      await this.cacheManager.set(
        fullKey,
        value,
        ttl || this.defaultTtl
      );
    } catch (error) {
      this.logger.error(`Error setting cache key ${key}: ${error.message}`, error.stack);
    }
  }

  /**
   * Set multiple values in cache
   * @param entries Array of key-value pairs with optional TTL
   */
  async mset(entries: { key: string; value: any; ttl?: number }[]): Promise<void> {
    try {
      await Promise.all(
        entries.map(({ key, value, ttl }) => 
          this.set(key, value, ttl)
        )
      );
    } catch (error) {
      this.logger.error(`Error setting multiple cache entries: ${error.message}`, error.stack);
    }
  }

  /**
   * Check if a key exists in cache
   * @param key Cache key
   * @returns Boolean indicating if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const value = await this.get(key);
      return value !== null && value !== undefined;
    } catch (error) {
      this.logger.error(`Error checking cache key ${key}: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Increment a numeric value in cache
   * @param key Cache key
   * @param delta Amount to increment by
   * @returns The new value
   */
  async increment(key: string, delta = 1): Promise<number | null> {
    try {
      const fullKey = this.generateKey(key);
      const value = await this.cacheManager.get<number>(fullKey);
      const newValue = (value || 0) + delta;
      await this.cacheManager.set(fullKey, newValue);
      return newValue;
    } catch (error) {
      this.logger.error(`Error incrementing cache key ${key}: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Delete a key from cache
   * @param key Cache key
   */
  async invalidate(key: string): Promise<void> {
    try {
      const fullKey = this.generateKey(key);
      await this.cacheManager.del(fullKey);
    } catch (error) {
      this.logger.error(`Error invalidating cache key ${key}: ${error.message}`, error.stack);
    }
  }

  /**
   * Delete multiple keys from cache
   * @param keys Array of cache keys
   */
  async invalidateMultiple(keys: string[]): Promise<void> {
    try {
      await Promise.all(keys.map(key => this.invalidate(key)));
    } catch (error) {
      this.logger.error(`Error invalidating multiple cache keys: ${error.message}`, error.stack);
    }
  }

  /**
   * Delete all keys matching a pattern (requires Redis)
   * @param pattern Pattern to match keys against
   * @returns Number of keys deleted
   */
  async invalidatePattern(pattern: string, exactMatch = false): Promise<number> {
    try {
      // Only Redis supports pattern-based deletion
      if (this.redisService.isEnabled()) {
        const fullPattern = this.generateKey(pattern);
        const searchPattern = exactMatch ? fullPattern : `${fullPattern}*`;
        const count = await this.redisService.deleteByPattern(searchPattern);
        this.logger.debug(`Invalidated ${count} keys matching pattern ${pattern}`);
        return count;
      } else {
        this.logger.warn(`Pattern-based invalidation not available: Redis is not enabled`);
        return 0;
      }
    } catch (error) {
      this.logger.error(`Error invalidating pattern ${pattern}: ${error.message}`, error.stack);
      return 0;
    }
  }

  /**
   * Get a value from cache or fetch it if not found
   * @param key Cache key
   * @param fetchFn Function to fetch the value if not in cache
   * @param ttl Time-to-live in seconds (optional)
   * @returns Cached or freshly fetched value
   */
  async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    try {
      const cached = await this.get<T>(key);
      if (cached !== null && cached !== undefined) {
        return cached;
      }

      const fresh = await fetchFn();
      
      // Don't cache null/undefined values
      if (fresh !== null && fresh !== undefined) {
        await this.set(key, fresh, ttl);
      }
      
      return fresh;
    } catch (error) {
      this.logger.error(`Cache fetch error for key ${key}: ${error.message}`, error.stack);
      // If cache fails, try to get fresh data directly
      return fetchFn();
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      // Use direct Redis service for clearing if available
      if (this.redisService.isEnabled()) {
        await this.redisService.flushAll();
        this.logger.log('Cache cleared via Redis service');
        return;
      }

      // Fallback to direct cache manager methods
      // Use the del method from the Cache interface for each key
      // This approach leverages the available API methods
      try {
        // For cache-manager v5+, we need to use flushall/reset differently
        const cacheManagerAny = this.cacheManager as any;
        if (typeof cacheManagerAny.reset === 'function') {
          await cacheManagerAny.reset();
          this.logger.log('Cache cleared via manager.reset()'); 
          return;
        }

        if (cacheManagerAny.store && typeof cacheManagerAny.store.reset === 'function') {
          await cacheManagerAny.store.reset();
          this.logger.log('Cache cleared via manager.store.reset()'); 
          return;
        }

        if (this.cacheManager.stores && Array.isArray(this.cacheManager.stores)) {
          for (const store of this.cacheManager.stores) {
            if (typeof (store as any).clear === 'function') {
              await (store as any).clear();
            }
          }
          this.logger.log('Cache cleared via stores array clear methods');
          return;
        }

        this.logger.warn('Could not find appropriate method to clear cache, using fallback approach');
        // Last fallback would be deleting all keys, but we don't have a list of all keys
        // without Redis, so we can only log that we couldn't completely clear
      } catch (clearError) {
        this.logger.error(`Error during cache clear operation: ${clearError.message}`, clearError.stack);
      }
      
      this.logger.log('Cache clear operation completed');
    } catch (error) {
      this.logger.error(`Error clearing cache: ${error.message}`, error.stack);
    }
  }
}