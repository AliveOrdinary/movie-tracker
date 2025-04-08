// src/modules/social/dto/activity-filters.input.ts
import { InputType, Field, Int } from '@nestjs/graphql';
import { IsEnum, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ActivityType } from '../entities/activity.entity';
import { ActivityFeedFilter } from '../../../common/enums';

@InputType()
export class ActivityFiltersInput {
  @Field(() => ActivityFeedFilter, { nullable: true })
  @IsOptional()
  @IsEnum(ActivityFeedFilter)
  filter?: ActivityFeedFilter;

  @Field(() => [ActivityType], { nullable: true })
  @IsOptional()
  @IsEnum(ActivityType, { each: true })
  types?: ActivityType[];

  @Field(() => Int, { nullable: true, defaultValue: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @Field(() => Int, { nullable: true, defaultValue: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;
}