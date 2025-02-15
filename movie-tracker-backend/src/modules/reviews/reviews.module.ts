// src/modules/reviews/reviews.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewsService } from './reviews.service';
import { ReviewsResolver } from './reviews.resolver';
import { Review } from './entities/review.entity';
import { ReviewReaction } from './entities/review-reaction.entity';
import { WatchHistoryModule } from '../watch-history/watch-history.module';
import { MoviesModule } from '../movies/movies.module';
import { ReviewsController } from './reviews.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-redis-store';

@Module({
  imports: [
    TypeOrmModule.forFeature([Review, ReviewReaction]),
    WatchHistoryModule,
    MoviesModule,
    NotificationsModule,
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get('REDIS_HOST', 'localhost'),
        port: configService.get('REDIS_PORT', 6379),
        ttl: 300, // 5 minutes cache
      }),
    }),
  ],
  providers: [
    ReviewsService,
    ReviewsResolver,
  ],
  controllers: [ReviewsController],
  exports: [ReviewsService],
})
export class ReviewsModule {}
