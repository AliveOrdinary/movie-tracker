//src/modules/admin/admin.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminResolver } from './admin.resolver';
import { ModerationLog } from './entities/moderation-log.entity';
import { Report } from './entities/report.entity';
import { UsersModule } from '../users/users.module';
import { ReviewsModule } from '../reviews/reviews.module';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-redis-store';

@Module({
  imports: [
    TypeOrmModule.forFeature([ModerationLog, Report]),
    UsersModule,
    ReviewsModule,
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get('REDIS_HOST', 'localhost'),
        port: configService.get('REDIS_PORT', 6379),
        ttl: configService.get('CACHE_TTL', 300),
      }),
    }),
  ],
  providers: [AdminService, AdminResolver],
  exports: [AdminService],
})
export class AdminModule {}