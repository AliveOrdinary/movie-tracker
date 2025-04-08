// src/common/config/cache.config.ts
import { CacheModuleAsyncOptions } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createClient } from 'redis';
import { CacheTTL } from '../constants/cache-ttl.constants';
import { redisStore } from 'cache-manager-redis-yet';


export const getCacheConfig = (): CacheModuleAsyncOptions => ({
  isGlobal: true,
  imports: [ConfigModule],
  useFactory: async (config: ConfigService) => {
    const isRedisEnabled = config.get('REDIS_ENABLED', 'true') === 'true';
    
    if (isRedisEnabled) {
      // Use Redis cache store
      const redisClient = createClient({
        socket: {
          host: config.get('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
        },
        password: config.get('REDIS_PASSWORD', ''),
        database: config.get<number>('REDIS_DB', 0),
      });

      return {
        store: await redisStore({
          socket: {
            host: config.get('REDIS_HOST', 'localhost'),
            port: config.get<number>('REDIS_PORT', 6379),
          },
          password: config.get('REDIS_PASSWORD', ''),
          database: config.get<number>('REDIS_DB', 0),
          ttl: config.get<number>('CACHE_TTL', CacheTTL.MEDIUM),
        }),
        ttl: config.get<number>('CACHE_TTL', CacheTTL.MEDIUM),
        max: config.get<number>('CACHE_MAX_ITEMS', 100),
      };
    } else {
      // Fallback to in-memory cache if Redis is not enabled
      return {
        ttl: config.get<number>('CACHE_TTL', CacheTTL.MEDIUM),
        max: config.get<number>('CACHE_MAX_ITEMS', 100),
      };
    }
  },
  inject: [ConfigService],
});