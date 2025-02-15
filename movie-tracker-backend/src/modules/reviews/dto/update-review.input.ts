// src/modules/reviews/dto/update-review.input.ts
import { InputType, Field, Int } from '@nestjs/graphql';
import { IsString, IsInt, Min, Max, MinLength, MaxLength, IsOptional, IsBoolean } from 'class-validator';

@InputType()
export class UpdateReviewInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(10, { message: 'Review must be at least 10 characters long' })
  @MaxLength(300, { message: 'Review cannot exceed 300 characters' })
  content?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  rating?: number;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  containsSpoilers?: boolean;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsString({ each: true })
  tags?: string[];
}