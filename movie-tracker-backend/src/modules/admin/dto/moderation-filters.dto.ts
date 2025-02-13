//src/modules/admin/dto/moderation-filters.dto.ts
import { InputType, Field, Int } from '@nestjs/graphql';
import { IsOptional, IsDateString, IsEnum, IsInt, Min } from 'class-validator';

export enum ContentSortField {
  CREATED_AT = 'createdAt',
  REPORTS_COUNT = 'reportsCount',
  LAST_REPORTED = 'lastReported'
}

@InputType()
export class ModerationFiltersInput {
  @Field(() => Date, { nullable: true })
  @IsOptional()
  @IsDateString()
  startDate?: Date;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  @IsDateString()
  endDate?: Date;

  @Field(() => ContentSortField, { nullable: true })
  @IsOptional()
  @IsEnum(ContentSortField)
  sortBy?: ContentSortField;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  resolvedOnly?: boolean;

  @Field(() => Int, { defaultValue: 1 })
  @IsInt()
  @Min(1)
  page: number;

  @Field(() => Int, { defaultValue: 10 })
  @IsInt()
  @Min(1)
  limit: number;
}