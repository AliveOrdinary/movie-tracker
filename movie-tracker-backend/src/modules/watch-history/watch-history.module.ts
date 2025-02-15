// src/modules/watch-history/watch-history.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WatchHistoryService } from './watch-history.service';
import { WatchHistoryResolver } from './watch-history.resolver';
import { WatchHistory } from './entities/watch-history.entity';
import { Movie } from '../movies/entities/movie.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([WatchHistory, Movie]),
  ],
  providers: [WatchHistoryService, WatchHistoryResolver],
  exports: [WatchHistoryService],
})
export class WatchHistoryModule {}