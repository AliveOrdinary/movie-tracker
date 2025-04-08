// src/modules/users/dto/user-stats.dto.ts
import { ObjectType, Field, Int, Float } from '@nestjs/graphql';

@ObjectType('UserGenreDistribution')
export class GenreDistribution {
  @Field()
  genre: string;

  @Field(() => Int)
  count: number;

  @Field(() => Float)
  percentage: number;
}

@ObjectType()
export class YearlyWatchStats {
  @Field(() => Int)
  year: number;

  @Field(() => Int)
  count: number;
}

@ObjectType('ProfileUserStats')
export class UserStats {
  @Field(() => Int)
  totalWatched: number;

  @Field(() => Int)
  totalReviews: number;

  @Field(() => Float)
  averageRating: number;

  @Field(() => Int)
  totalLists: number;

  @Field(() => Int)
  totalFollowers: number;

  @Field(() => Int)
  totalFollowing: number;

  @Field(() => Int)
  watchTimeMinutes: number;

  @Field(() => Float)
  watchesPerMonth: number;

  @Field(() => Int)
  favoritesCount: number;

  @Field(() => [GenreDistribution])
  genreDistribution: GenreDistribution[];

  @Field(() => [YearlyWatchStats])
  yearlyWatchStats: YearlyWatchStats[];
}
