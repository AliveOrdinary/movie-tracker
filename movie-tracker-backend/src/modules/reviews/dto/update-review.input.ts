//src/modules/reviews/dto/update-review.input.ts
import { InputType, Field, Int } from '@nestjs/graphql';
import { IsString, IsInt, Min, Max, MinLength, IsOptional } from 'class-validator';

@InputType()
export class UpdateReviewInput {
  @Field(() => String, { nullable: true })
  @IsString()
  @MinLength(3)
  @IsOptional()
  title?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @MinLength(10)
  @IsOptional()
  content?: string;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  rating?: number;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  tags?: string[];

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  containsSpoilers?: boolean;
}