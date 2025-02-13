//src/modules/movies/dto/paginated-movies.type.ts
import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Movie } from '../entities/movie.entity';

@ObjectType()
export class PaginatedMovies {
  @Field(() => [Movie])
  results: Movie[];

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  totalPages: number;

  @Field(() => Int)
  totalResults: number;
}