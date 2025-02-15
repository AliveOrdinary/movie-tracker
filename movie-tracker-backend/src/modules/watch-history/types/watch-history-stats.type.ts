// src/modules/watch-history/types/watch-history-stats.type.ts
import { ObjectType, Field, Int, Float } from '@nestjs/graphql';

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
}