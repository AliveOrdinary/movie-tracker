// src/common/config/redis.config.ts
import { ConfigService } from '@nestjs/config';
import { RedisClientOptions } from '@redis/client';
import { CacheTTL } from '../constants/cache-ttl.constants';

export const getRedisConfig = (
  configService: ConfigService
): RedisClientOptions => {
  const options: any = {
    socket: {
      host: configService.get('REDIS_HOST', 'localhost'),
      port: configService.get<number>('REDIS_PORT', 6379),
    },
    password: configService.get('REDIS_PASSWORD', ''),
    database: configService.get<number>('REDIS_DB', 0),
    // Advanced options for better reliability
    retryStrategy: (times: number) => {
      // Maximum retry delay is 3000ms
      return Math.min(times * 100, 3000);
    },
  };
  
  // TTL as a separate property used in application logic
  (options as any).commandOptions = {
    ttl: configService.get<number>('CACHE_TTL', CacheTTL.MEDIUM)
  };
  
  return options;
};