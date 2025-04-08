// src/modules/watch-history/dto/create-watch.input.ts
import { InputType, Field, Int, Float } from '@nestjs/graphql';
import { IsDate, IsEnum, IsUUID, IsOptional, IsBoolean, IsNumber, Min, Max, IsString } from 'class-validator';
import { WatchType } from 'src/common/enums';

@InputType()
export class CreateWatchInput {
  @Field(() => Int)
  @IsNumber()
  @Min(1, { message: 'TMDB ID must be a positive integer' })
  tmdbId: number; // Using TMDB ID for input, will be resolved to UUID internally

  @Field(() => Date)
  @IsDate()
  watchedAt: Date;

  @Field(() => WatchType)
  @IsEnum(WatchType)
  watchType: WatchType;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  rating?: number;

  @Field({ nullable: true })
  @IsOptional()
  notes?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  watchDuration?: number;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isFavorite?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  contextTags?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  moodRating?: number;
}