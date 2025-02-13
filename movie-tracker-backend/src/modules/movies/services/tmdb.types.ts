// src/modules/movies/types/tmdb.types.ts
import { ObjectType, Field, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class TMDBMovie {
  @Field(() => Int)
  id: number;

  @Field()
  title: string;

  @Field()
  original_title: string;

  @Field({ nullable: true })
  overview?: string;

  @Field(() => String, { nullable: true })
  poster_path?: string | null;

  @Field(() => String, { nullable: true })
  backdrop_path?: string | null;

  @Field(() => Float)
  vote_average: number;

  @Field(() => Int)
  vote_count: number;

  @Field(() => String)
  release_date: string;

  @Field(() => [Int])
  genre_ids: number[];

  @Field(() => Boolean)
  adult: boolean;

  @Field(() => String, { nullable: true })
  original_language?: string;
}

@ObjectType()
export class TMDBPagination {
  @Field(() => Int)
  page: number;

  @Field(() => Int)
  total_pages: number;

  @Field(() => Int)
  total_results: number;
}

@ObjectType()
export class TMDBResponse extends TMDBPagination {
  @Field(() => [TMDBMovie])
  results: TMDBMovie[];
}

@ObjectType()
export class TMDBGenre {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;
}

@ObjectType()
export class TMDBMovieDetails extends TMDBMovie {
  @Field(() => [TMDBGenre])
  genres: TMDBGenre[];

  @Field(() => Int, { nullable: true })
  runtime?: number;

  @Field(() => String, { nullable: true })
  tagline?: string;

  @Field(() => Float, { nullable: true })
  budget?: number;

  @Field(() => Float, { nullable: true })
  revenue?: number;

  @Field(() => String, { nullable: true })
  status?: string;
}

@ObjectType()
export class TMDBCast {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;

  @Field(() => String, { nullable: true })
  character?: string;

  @Field(() => String, { nullable: true })
  profile_path?: string;

  @Field(() => Int)
  order: number;
}

@ObjectType()
export class TMDBCrew {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;

  @Field()
  job: string;

  @Field()
  department: string;

  @Field(() => String, { nullable: true })
  profile_path?: string;
}

@ObjectType()
export class TMDBCredits {
  @Field(() => [TMDBCast])
  cast: TMDBCast[];

  @Field(() => [TMDBCrew])
  crew: TMDBCrew[];
}

@ObjectType()
export class TMDBVideo {
  @Field()
  id: string;

  @Field()
  key: string;

  @Field()
  name: string;

  @Field()
  site: string;

  @Field()
  type: string;

  @Field(() => Boolean)
  official: boolean;
}

@ObjectType()
export class TMDBVideoResponse {
  @Field(() => [TMDBVideo])
  results: TMDBVideo[];
}

export interface TMDBConfiguration {
  images: {
    base_url: string;
    secure_base_url: string;
    backdrop_sizes: string[];
    logo_sizes: string[];
    poster_sizes: string[];
    profile_sizes: string[];
    still_sizes: string[];
  };
}

export interface TMDBError {
  status_message: string;
  status_code: number;
}