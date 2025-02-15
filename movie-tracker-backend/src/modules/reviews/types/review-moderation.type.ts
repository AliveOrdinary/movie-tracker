// src/modules/reviews/types/review-moderation.type.ts
import { ObjectType, Field, registerEnumType } from '@nestjs/graphql';

export enum ModerationAction {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  FLAG = 'FLAG'
}

registerEnumType(ModerationAction, {
  name: 'ModerationAction',
  description: 'Available moderation actions for reviews',
});

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