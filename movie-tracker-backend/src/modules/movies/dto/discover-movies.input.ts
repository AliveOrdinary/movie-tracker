//src/modules/movies/dto/discover-movies.input.ts
import { InputType, Field, Int, Float } from '@nestjs/graphql';
import { IsOptional, IsInt, Min, Max, IsString, IsArray, IsBoolean } from 'class-validator';

@InputType()
export class DiscoverMoviesInput {
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear() + 10)
  year?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  genre?: number;

  @Field(() => [Int], { nullable: true })
  @IsOptional()
  @IsArray()
  genreIds?: number[];

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @Min(0)
  @Max(10)
  voteAverageGte?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @Min(0)
  voteCountGte?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  releaseYear?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  releaseDateGte?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  releaseDateLte?: string;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  includeAdult?: boolean;

  @Field(() => String, { nullable: true })
  @IsOptional()
  originalLanguage?: string;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  includeVideo?: boolean;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  withKeywords?: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  withoutKeywords?: string[];

  @Field(() => String, { nullable: true })
  @IsOptional()
  region?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  sortBy?: 'popularity.asc' | 'popularity.desc' | 'revenue.asc' | 'revenue.desc' | 
          'primary_release_date.asc' | 'primary_release_date.desc' | 'vote_average.asc' | 
          'vote_average.desc' | 'vote_count.asc' | 'vote_count.desc';

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;
}