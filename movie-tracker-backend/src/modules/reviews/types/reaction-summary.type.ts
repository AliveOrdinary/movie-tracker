// src/modules/reviews/types/reaction-summary.type.ts
import { ObjectType, Field, Int } from '@nestjs/graphql';
import { ReactionType } from '../entities/review-reaction.entity';

@ObjectType()
export class ReactionSummary {
  @Field(() => ReactionType)
  type: ReactionType;

  @Field(() => Int)
  count: number;

  @Field(() => Boolean)
  hasReacted: boolean;

  @Field(() => [String])
  recentUserIds: string[];
}