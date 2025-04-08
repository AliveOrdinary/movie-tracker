// src/modules/cache/redis.service.ts
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { CacheKeyFactory } from '../../common/factories/cache-key.factory';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private redisClient: Redis;
  private redisEnabled: boolean;

  constructor(
    private readonly configService: ConfigService,
    protected readonly cacheKeyFactory: CacheKeyFactory
  ) {
    this.redisEnabled = this.configService.get('REDIS_ENABLED', 'true') === 'true';
    
    if (this.redisEnabled) {
      this.initializeRedisClient();
    } else {
      this.logger.log('Redis is disabled by configuration');
    }
  }

  private initializeRedisClient() {
    try {
      this.redisClient = new Redis({
        host: this.configService.get('REDIS_HOST', 'localhost'),
        port: this.configService.get<number>('REDIS_PORT', 6379),
        password: this.configService.get('REDIS_PASSWORD', ''),
        db: this.configService.get<number>('REDIS_DB', 0),
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 100, 3000);
          this.logger.log(`Redis connection attempt ${times}, retrying in ${delay}ms`);
          return delay;
        },
        reconnectOnError: (err) => {
          this.logger.error(`Redis connection error: ${err.message}`);
          // Only reconnect on specific errors
          const targetErrors = ['READONLY', 'ETIMEDOUT', 'ECONNREFUSED', 'ECONNRESET'];
          return targetErrors.some(e => err.message.includes(e));
        },
      });

      this.redisClient.on('error', (error) => {
        this.logger.error(`Redis client error: ${error.message}`);
      });

      this.redisClient.on('connect', () => {
        this.logger.log('Connected to Redis server');
      });

      this.redisClient.on('reconnecting', () => {
        this.logger.log('Reconnecting to Redis server');
      });
    } catch (error) {
      this.logger.error(`Failed to initialize Redis client: ${error.message}`);
      this.redisEnabled = false;
    }
  }

  getClient(): Redis | null {
    return this.redisEnabled ? this.redisClient : null;
  }

  isEnabled(): boolean {
    return this.redisEnabled;
  }

  async ping(): Promise<string> {
    if (!this.redisEnabled || !this.redisClient) {
      throw new Error('Redis client not initialized');
    }
    
    try {
      return await this.redisClient.ping();
    } catch (error) {
      this.logger.error(`Error pinging Redis: ${error.message}`);
      throw error;
    }
  }

  async keys(pattern: string): Promise<string[]> {
    if (!this.redisEnabled || !this.redisClient) {
      return [];
    }
    
    try {
      return await this.redisClient.keys(pattern);
    } catch (error) {
      this.logger.error(`Error getting keys with pattern ${pattern}: ${error.message}`);
      return [];
    }
  }

  async deleteByPattern(pattern: string): Promise<number> {
    if (!this.redisEnabled || !this.redisClient) {
      return 0;
    }
    
    try {
      const keys = await this.redisClient.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }
      
      // If there are many keys, delete them in batches to avoid issues with large argument lists
      if (keys.length > 100) {
        let deleted = 0;
        const batchSize = 100;
        for (let i = 0; i < keys.length; i += batchSize) {
          const batch = keys.slice(i, i + batchSize);
          deleted += await this.redisClient.del(...batch);
        }
        return deleted;
      }
      
      return await this.redisClient.del(...keys);
    } catch (error) {
      this.logger.error(`Error deleting keys with pattern ${pattern}: ${error.message}`);
      return 0;
    }
  }

  /**
   * Flush all keys in the Redis database
   * @returns Returns true if successful
   */
  async flushAll(): Promise<boolean> {
    if (!this.redisEnabled || !this.redisClient) {
      return false;
    }
    
    try {
      await this.redisClient.flushdb();
      this.logger.log('Redis cache flushed successfully');
      return true;
    } catch (error) {
      this.logger.error(`Error flushing Redis cache: ${error.message}`);
      return false;
    }
  }

  async onModuleDestroy() {
    if (this.redisEnabled && this.redisClient) {
      this.logger.log('Closing Redis connection');
      await this.redisClient.quit();
    }
  }
}