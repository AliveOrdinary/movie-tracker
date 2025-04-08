// src/modules/watch-history/types/watch-history-stats.type.ts
import { ObjectType, Field, Int, Float } from '@nestjs/graphql';

@ObjectType('WatchHistoryGenreDistribution')
export class GenreDistribution {
  @Field()
  genre: string;

  @Field(() => Int)
  count: number;

  @Field(() => Float)
  percentage: number;
}

@ObjectType()
export class YearDistribution {
  @Field(() => Int)
  year: number;

  @Field(() => Int)
  count: number;

  @Field(() => Float)
  percentage: number;
}

@ObjectType()
export class WatchTypeDistribution {
  @Field()
  type: string;

  @Field(() => Int)
  count: number;

  @Field(() => Float)
  percentage: number;
}

@ObjectType()
export class MonthlyWatchCount {
  @Field()
  month: string;

  @Field(() => Int)
  year: number;

  @Field(() => Int)
  count: number;
}

@ObjectType()
export class WatchHistoryStats {
  @Field(() => Int)
  totalWatch: number;

  @Field(() => Int)
  uniqueMovies: number;

  @Field(() => Int)
  totalWatchTime: number;

  @Field(() => Float)
  averageRating: number;

  @Field(() => Int, { nullable: true })
  totalRewatches?: number;

  @Field(() => Float, { nullable: true })
  averageWatchesPerMovie?: number;

  @Field(() => Date, { nullable: true })
  firstWatchDate?: Date | null | undefined;

  @Field(() => Date, { nullable: true })
  lastWatchDate?: Date | null | undefined;

  @Field(() => Int, { nullable: true })
  favoriteCount?: number;

  @Field(() => Int, { nullable: true })
  totalDays?: number;

  @Field(() => [GenreDistribution], { nullable: true })
  genreDistribution?: GenreDistribution[];

  @Field(() => [YearDistribution], { nullable: true })
  yearDistribution?: YearDistribution[];

  @Field(() => [WatchTypeDistribution], { nullable: true })
  watchTypeDistribution?: WatchTypeDistribution[];

  @Field(() => [MonthlyWatchCount], { nullable: true })
  monthlyWatchCounts?: MonthlyWatchCount[];

  @Field(() => Float, { nullable: true })
  averageMoodRating?: number;
}