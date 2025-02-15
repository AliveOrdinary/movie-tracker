// src/modules/reviews/types/review-stats.type.ts
import { ObjectType, Field, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class ReviewStats {
  @Field(() => Int)
  totalReviews: number;

  @Field(() => Float)
  averageRating: number;

  @Field(() => Int)
  totalReactions: number;

  @Field(() => Int)
  recentReviews: number;

  @Field(() => Float)
  positivePercentage: number;
}