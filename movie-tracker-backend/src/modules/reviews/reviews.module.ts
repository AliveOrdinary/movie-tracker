// src/modules/reviews/reviews.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ReviewsService } from './reviews.service';
import { ReviewsResolver } from './reviews.resolver';
import { ReviewsTmdbService } from './reviews-tmdb.service';
import { Review } from './entities/review.entity';
import { ReviewReaction } from './entities/review-reaction.entity';
import { WatchHistoryModule } from '../watch-history/watch-history.module';
import { MoviesModule } from '../movies/movies.module';
import { ReviewsController } from './reviews.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { ModerationModule } from '../moderation/moderation.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { FirebaseModule } from '../../firebase/firebase.module';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../../auth/auth.module';
import { CacheModule } from '../cache/cache.module';
import { TokenModule } from '../../auth/services/token.module';
import { ReviewCacheInterceptor } from './interceptors/review-cache.interceptor';

@Module({
  imports: [
    TypeOrmModule.forFeature([Review, ReviewReaction]),
    forwardRef(() => WatchHistoryModule),
    forwardRef(() => MoviesModule),
    NotificationsModule,
    forwardRef(() => ModerationModule),
    EventEmitterModule.forRoot(),
    FirebaseModule,
    UsersModule,
    AuthModule,
    TokenModule,
    CacheModule,
  ],
  providers: [
    ReviewsService,
    ReviewsResolver,
    ReviewsTmdbService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ReviewCacheInterceptor,
    }
  ],
  controllers: [ReviewsController],
  exports: [ReviewsService, ReviewsTmdbService],
})
export class ReviewsModule {}