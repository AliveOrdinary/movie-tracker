// src/modules/watch-history/dto/watch-history-filters.input.ts
import { InputType, Field, Int } from '@nestjs/graphql';
import { IsOptional, IsDate, IsEnum, IsInt, Min } from 'class-validator';

export enum WatchHistorySortField {
  WATCHED_AT = 'watchedAt',
  RATING = 'rating',
  CREATED_AT = 'createdAt'
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

  @Field(() => WatchHistorySortField, { nullable: true })
  @IsOptional()
  @IsEnum(WatchHistorySortField)
  sortBy?: WatchHistorySortField;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  includePrivate?: boolean;

  @Field(() => Int, { defaultValue: 1 })
  @IsInt()
  @Min(1)
  page: number;

  @Field(() => Int, { defaultValue: 10 })
  @IsInt()
  @Min(1)
  limit: number;
}