//src/modules/movies/movies.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { MoviesService } from './movies.service';
import { MoviesResolver } from './movies.resolver';
import { TMDBService } from './services/tmdb.service';
import { Movie } from './entities/movie.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Movie]),
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  providers: [MoviesService, MoviesResolver, TMDBService],
  exports: [MoviesService],
})
export class MoviesModule {}