import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { MoviesResolver } from './movies.resolver';
import { MoviesService } from './movies.service';
import { Movie } from './entities/movie.entity';
import { Review } from '../reviews/entities/review.entity';
import { TMDBService } from './services/tmdb.service';
import { CacheModule } from '../cache/cache.module';
import { CacheService } from '../../common/services/cache.service';
import { CacheKeyFactory } from '../../common/factories/cache-key.factory';

@Module({
  imports: [
    TypeOrmModule.forFeature([Movie, Review]),
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    CacheModule,
    ConfigModule,
  ],
  providers: [
    MoviesResolver,
    MoviesService,
    TMDBService,
    CacheService,
    CacheKeyFactory,
  ],
  exports: [MoviesService],
})
export class MoviesModule {}