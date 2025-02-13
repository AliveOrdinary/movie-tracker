//src/modules/reviews/reviews.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewsService } from './reviews.service';
import { ReviewsResolver } from './reviews.resolver';
import { Review } from './entities/review.entity';
import { Movie } from '../movies/entities/movie.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Review, Movie]),
  ],
  providers: [ReviewsService, ReviewsResolver],
  exports: [ReviewsService],
})
export class ReviewsModule {}