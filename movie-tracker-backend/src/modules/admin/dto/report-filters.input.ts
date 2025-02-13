//src/modules/admin/dto/report-filters.input.ts
import { InputType, Field, Int } from '@nestjs/graphql';
import { IsOptional, IsUUID, IsBoolean, IsInt, Min } from 'class-validator';

@InputType()
export class ReportFiltersInput {
  @Field(() => String, { nullable: true })
  @IsUUID()
  @IsOptional()
  userId?: string;

  @Field(() => String, { nullable: true })
  @IsUUID()
  @IsOptional()
  reviewId?: string;

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  resolved?: boolean;

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  skip?: number;

  @Field(() => Int, { nullable: true, defaultValue: 10 })
  @IsInt()
  @Min(1)
  @IsOptional()
  take?: number;
}