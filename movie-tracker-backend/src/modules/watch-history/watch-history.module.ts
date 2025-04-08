// src/modules/watch-history/watch-history.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WatchHistoryService } from './watch-history.service';
import { WatchHistoryResolver } from './watch-history.resolver';
import { WatchHistoryTmdbService } from './watch-history-tmdb.service';
import { WatchHistory } from './entities/watch-history.entity';
import { Movie } from '../movies/entities/movie.entity';
import { FirebaseModule } from '../../firebase/firebase.module';
import { UsersModule } from '../users/users.module';
import { TokenModule } from '../../auth/services/token.module';
import { CacheModule } from '../cache/cache.module';
import { CacheService } from '../../common/services/cache.service';
import { CacheKeyFactory } from '../../common/factories/cache-key.factory';

@Module({
  imports: [
    TypeOrmModule.forFeature([WatchHistory, Movie]),
    FirebaseModule,
    UsersModule,
    TokenModule,
    CacheModule,
  ],
  providers: [WatchHistoryService, WatchHistoryResolver],
  exports: [WatchHistoryService],
})
export class WatchHistoryModule {}