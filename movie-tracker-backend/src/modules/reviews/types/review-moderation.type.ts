// src/modules/reviews/types/review-moderation.type.ts
import { ObjectType, Field } from '@nestjs/graphql';
import { ModerationAction } from 'src/common/enums';

@ObjectType()
export class ModerationResult {
  @Field()
  success: boolean;

  @Field({ nullable: true })
  message?: string;

  @Field(() => ModerationAction)
  action: ModerationAction;

  @Field()
  reviewId: string;

  @Field()
  moderatedAt: Date;

  @Field({ nullable: true })
  reason?: string;
}