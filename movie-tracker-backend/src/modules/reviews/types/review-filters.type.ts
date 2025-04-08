// src/modules/reviews/types/review-filters.type.ts
import { InputType, Field, Int } from '@nestjs/graphql';
import { IsOptional, IsEnum, IsInt, IsBoolean, IsDate, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ReviewsSortOrder, ReviewStatus } from '../../../common/enums';

@InputType()
export class ReviewFilters {
  @Field(() => String, { nullable: true })
  @IsOptional()
  sortBy?: string;

  @Field(() => ReviewStatus, { nullable: true })
  @IsOptional()
  @IsEnum(ReviewStatus)
  status?: ReviewStatus;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
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

  @Field(() => Date, { nullable: true })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @Field(() => Int, { nullable: true, defaultValue: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @Field(() => Int, { nullable: true, defaultValue: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}

@InputType()
export class UserReviewFilters extends ReviewFilters {
  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  includePrivate?: boolean;
}

@InputType()
export class MovieReviewFilters extends ReviewFilters {
  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  onlyVerifiedWatches?: boolean;
}