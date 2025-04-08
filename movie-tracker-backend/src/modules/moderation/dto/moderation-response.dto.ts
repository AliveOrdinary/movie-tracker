// src/modules/moderation/dto/moderation-response.dto.ts
import { ObjectType, Field, Int } from '@nestjs/graphql';
import { ModerationQueue } from '../entities/moderation-queue.entity';
import { AutoModerationRule } from '../entities/auto-moderation-rule.entity';
import { UserReputation } from '../entities/user-reputation.entity';

@ObjectType()
export class ModerationQueueResponse {
  @Field(() => [ModerationQueue])
  items: ModerationQueue[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Int)
  totalPages: number;
}

@ObjectType()
export class ModerationStatistics {
  @Field(() => Int)
  pendingCount: number;

  @Field(() => Int)
  inReviewCount: number;

  @Field(() => Int)
  todayResolvedCount: number;

  @Field(() => Int)
  totalResolvedCount: number;

  @Field(() => Int)
  autoFlaggedCount: number;

  @Field(() => Int)
  averageResolutionTimeMinutes: number;
}

@ObjectType()
export class AutoModerationRuleResponse {
  @Field(() => [AutoModerationRule])
  items: AutoModerationRule[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Int)
  totalPages: number;
}

@ObjectType()
export class UserReputationResponse {
  @Field(() => [UserReputation])
  items: UserReputation[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Int)
  totalPages: number;
}