//src/modules/reviews/dto/create-review.input.ts
import { InputType, Field, Int } from '@nestjs/graphql';
import { IsString, IsInt, Min, Max, MinLength } from 'class-validator';

@InputType()
export class CreateReviewInput {
  @Field()
  @IsString()
  movieId: string;

  @Field()
  @IsString()
  @MinLength(3)
  title: string;

  @Field()
  @IsString()
  @MinLength(10)
  content: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  @Max(10)
  rating: number;

  @Field(() => [String], { nullable: true })
  tags?: string[];

  @Field(() => Boolean, { defaultValue: false })
  containsSpoilers: boolean;
}