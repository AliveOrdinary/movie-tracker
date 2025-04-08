// src/modules/lists/dto/list-stats.type.ts
import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class ListGenreStats {
  @Field()
  genre: string;

  @Field(() => Int)
  count: number;
}

@ObjectType()
export class ListYearStats {
  @Field(() => Int)
  year: number;

  @Field(() => Int)
  count: number;
}

@ObjectType()
export class ListMovieStats {
  @Field(() => Int)
  totalMovies: number;

  @Field(() => Int)
  uniqueMovies: number;

  @Field(() => [ListGenreStats])
  genreDistribution: ListGenreStats[];

  @Field(() => [ListYearStats])
  yearDistribution: ListYearStats[];

  @Field(() => Number, { nullable: true })
  averageRating?: number;
}