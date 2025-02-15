// src/modules/reviews/types/review-filters.type.ts
import { InputType, Field, Int, registerEnumType } from '@nestjs/graphql';
import { IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';

export enum ReviewSortType {
  RECENT = 'RECENT',
  RATING = 'RATING',
  REACTIONS = 'REACTIONS',
  HELPFUL = 'HELPFUL'
}

registerEnumType(ReviewSortType, {
  name: 'ReviewSortType',
  description: 'Available sorting options for reviews',
});

@InputType()
export class ReviewFilters {
  @Field(() => ReviewSortType, { nullable: true })
  @IsOptional()
  @IsEnum(ReviewSortType)
  sortBy?: ReviewSortType;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  showSpoilers?: boolean;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  minRating?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  maxRating?: number;

  @Field(() => Int, { defaultValue: 1 })
  @IsInt()
  @Min(1)
  page: number = 1;

  @Field(() => Int, { defaultValue: 10 })
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 10;
}