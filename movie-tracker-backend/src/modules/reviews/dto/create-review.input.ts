// src/modules/reviews/dto/create-review.input.ts
import { InputType, Field, Int } from '@nestjs/graphql';
import { IsString, IsInt, Min, Max, MinLength, MaxLength, IsUUID, IsOptional, IsBoolean } from 'class-validator';

@InputType()
export class CreateReviewInput {
  @Field(() => Int)
  @IsInt()
  @Min(1, { message: 'Movie TMDB ID must be a positive integer' })
  tmdbId: number; // Using TMDB ID instead of internal UUID

  @Field(() => String)
  @IsString()
  @MinLength(10, { message: 'Review must be at least 10 characters long' })
  @MaxLength(300, { message: 'Review cannot exceed 300 characters' })
  content: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  @Max(10)
  rating: number;

  @Field(() => Boolean, { defaultValue: false })
  @IsBoolean()
  containsSpoilers: boolean;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsString({ each: true })
  tags?: string[];

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID()
  watchHistoryId?: string;
  
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  movieMetadata?: string;
}