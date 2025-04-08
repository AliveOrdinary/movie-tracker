import { Field, ObjectType, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class TMDBMovie {
  @Field(() => Int)
  id: number;

  @Field()
  title: string;

  @Field()
  original_title: string;

  @Field()
  overview: string;

  @Field({ nullable: true })
  poster_path?: string;

  @Field({ nullable: true })
  backdrop_path?: string;

  @Field(() => Float)
  vote_average: number;

  @Field(() => Int)
  vote_count: number;

  @Field()
  release_date: string;

  @Field(() => [Int])
  genre_ids: number[];

  @Field()
  adult: boolean;

  @Field()
  original_language: string;

  @Field(() => Float)
  popularity: number;
}

@ObjectType()
export class TMDBResponse {
  @Field(() => Int)
  page: number;

  @Field(() => [TMDBMovie])
  results: TMDBMovie[];

  @Field(() => Int)
  total_pages: number;

  @Field(() => Int)
  total_results: number;
}

@ObjectType()
export class TMDBMovieDetails extends TMDBMovie {
  @Field(() => Int, { nullable: true })
  runtime?: number;

  @Field(() => [TMDBGenre])
  genres: TMDBGenre[];

  @Field(() => [TMDBLanguage])
  spoken_languages: TMDBLanguage[];
}

@ObjectType()
export class TMDBWatchProvider {
  @Field()
  provider_id: number;

  @Field()
  provider_name: string;

  @Field()
  logo_path: string;
}

@ObjectType()
export class CountryWatchProviders {
  @Field(() => [TMDBWatchProvider], { nullable: true })
  rent?: TMDBWatchProvider[];

  @Field(() => [TMDBWatchProvider], { nullable: true })
  buy?: TMDBWatchProvider[];

  @Field(() => [TMDBWatchProvider], { nullable: true })
  flatrate?: TMDBWatchProvider[];

  @Field()
  link: string;
}

@ObjectType()
export class TMDBWatchProvidersResponse {
  @Field(() => Int)
  id: number;

  @Field(() => [CountryWatchProviders])
  results: {
    [countryCode: string]: CountryWatchProviders;
  };
}

@ObjectType()
export class TMDBGenre {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;
}

@ObjectType()
export class TMDBLanguage {
  @Field()
  iso_639_1: string;

  @Field()
  name: string;
}

@ObjectType()
export class TMDBCredits {
  @Field(() => [TMDBCast])
  cast: TMDBCast[];

  @Field(() => [TMDBCrew])
  crew: TMDBCrew[];
}

@ObjectType()
export class TMDBCast {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;

  @Field({ nullable: true })
  character?: string;

  @Field(() => Int)
  order: number;

  @Field({ nullable: true })
  profile_path?: string;
}

@ObjectType()
export class TMDBCrew {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;

  @Field()
  department: string;

  @Field()
  job: string;

  @Field({ nullable: true })
  profile_path?: string;
}

@ObjectType()
export class TMDBVideoResponse {
  @Field(() => [TMDBVideo])
  results: TMDBVideo[];
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

  @Field()
  official: boolean;
}

@ObjectType()
export class TMDBImageConfiguration {
  @Field()
  secure_base_url: string;

  @Field(() => [String])
  poster_sizes: string[];

  @Field(() => [String])
  backdrop_sizes: string[];
}

@ObjectType()
export class TMDBConfiguration {
  @Field(() => TMDBImageConfiguration)
  images: TMDBImageConfiguration;
}

@ObjectType()
export class TMDBGenresResponse {
  @Field(() => [TMDBGenre])
  genres: TMDBGenre[];
}

export interface TMDBError {
  status_message: string;
  status_code: number;
}