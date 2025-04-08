// src/modules/cache/cache.module.ts
import { Global, Module, OnModuleInit, Logger } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheService } from '../../common/services/cache.service';
import { RedisService } from './redis.service';
import { getCacheConfig } from '../../common/config/cache.config';
import { CacheKeyFactory } from '../../common/factories/cache-key.factory';

@Global()
@Module({
  imports: [
    ConfigModule,
    NestCacheModule.registerAsync(getCacheConfig()),
  ],
  providers: [CacheService, RedisService, CacheKeyFactory],
  exports: [CacheService, RedisService, CacheKeyFactory, NestCacheModule],
})
export class CacheModule implements OnModuleInit {
  private readonly logger = new Logger(CacheModule.name);

  constructor(
    private configService: ConfigService,
    private redisService: RedisService
  ) {}

  async onModuleInit() {
    const isRedisEnabled = this.configService.get('REDIS_ENABLED', 'true') === 'true';
    
    if (isRedisEnabled) {
      try {
        await this.redisService.ping();
        this.logger.log('Redis connection established successfully');
      } catch (error) {
        this.logger.error(`Failed to connect to Redis: ${error.message}`);
        this.logger.warn('Falling back to in-memory cache');
      }
    } else {
      this.logger.log('Redis is disabled, using in-memory cache');
    }
  }
}