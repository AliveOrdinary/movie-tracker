// src/modules/admin/dto/admin-content-stats.dto.ts
import { ObjectType, Field, Int, Float } from '@nestjs/graphql';
import { Movie } from '../../movies/entities/movie.entity';

@ObjectType()
export class ContentTypeStats {
  @Field(() => Int)
  total: number;

  @Field(() => Int)
  today: number;

  @Field(() => Int)
  lastWeek: number;

  @Field(() => Int)
  lastMonth: number;
}

@ObjectType()
export class ReviewStats extends ContentTypeStats {
  @Field(() => Int)
  pending: number;

  @Field(() => Int)
  approved: number;

  @Field(() => Int)
  rejected: number;

  @Field(() => Int)
  flagged: number;
}

@ObjectType()
export class GenreTrend {
  @Field()
  genre: string;

  @Field(() => Int)
  count: number;
}

@ObjectType()
export class GenreAnalytics {
  @Field()
  genre: string;

  @Field(() => Int)
  count: number;

  @Field(() => Float, { nullable: true })
  percentage?: number;

  @Field(() => Int, { nullable: true })
  growth?: number;
}

@ObjectType()
export class AdminContentStats {
  @Field(() => ReviewStats)
  reviews: ReviewStats;

  @Field(() => ContentTypeStats)
  lists: ContentTypeStats;

  @Field(() => ContentTypeStats)
  watches: ContentTypeStats;

  @Field(() => [Movie])
  popularMovies: Movie[];

  @Field(() => [GenreTrend])
  trendingGenres: GenreTrend[];
}