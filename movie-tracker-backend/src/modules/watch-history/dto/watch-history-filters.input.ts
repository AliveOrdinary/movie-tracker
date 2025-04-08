// src/modules/watch-history/dto/watch-history-filters.input.ts
import { InputType, Field, Int, Float } from '@nestjs/graphql';
import { IsOptional, IsDate, IsEnum, IsInt, Min, Max, IsString, IsBoolean } from 'class-validator';
import { WatchType } from 'src/common/enums';

export enum WatchHistorySortField {
  WATCHED_AT = 'watchedAt',
  RATING = 'rating',
  CREATED_AT = 'createdAt',
  WATCH_COUNT = 'watchCount',
  MOOD_RATING = 'moodRating'
}

@InputType()
export class WatchHistoryFiltersInput {
  @Field(() => Date, { nullable: true })
  @IsOptional()
  @IsDate()
  startDate?: Date;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  @IsDate()
  endDate?: Date;

  @Field(() => String, { nullable: true, defaultValue: "watchedAt" })
  @IsOptional()
  sortBy?: string = "watchedAt";

  @Field(() => String, { nullable: true })
  @IsOptional()
  sortDirection?: 'ASC' | 'DESC' = 'DESC';

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  includePrivate?: boolean = false;

  @Field(() => WatchType, { nullable: true })
  @IsOptional()
  @IsEnum(WatchType)
  watchType?: WatchType;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @Min(0)
  @Max(10)
  minRating?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @Min(0)
  @Max(10)
  maxRating?: number;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  onlyFavorites?: boolean = false;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  tagFilter?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  searchTerm?: string;

  @Field(() => Int, { defaultValue: 1 })
  @IsInt()
  @Min(1)
  page: number = 1;

  @Field(() => Int, { defaultValue: 10 })
  @IsInt()
  @Min(1)
  limit: number = 10;
}