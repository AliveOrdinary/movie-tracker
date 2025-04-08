// src/modules/admin/dto/admin-dashboard-stats.dto.ts
import { ObjectType, Field, Int } from '@nestjs/graphql';
import { UserRoleStats } from './user-role-stats.dto';

@ObjectType('DashboardUserStats')
export class UserStats {
  @Field(() => Int)
  total: number;

  @Field(() => Int)
  newToday: number;

  @Field(() => Int)
  newLastWeek: number;

  @Field(() => Int)
  newLastMonth: number;

  @Field(() => Int)
  activeToday: number;

  @Field(() => Int)
  activeLastWeek: number;

  @Field(() => [UserRoleStats])
  roleDistribution: UserRoleStats[];
}

@ObjectType()
export class ContentStats {
  @Field(() => Int)
  totalReviews: number;

  @Field(() => Int)
  newReviewsToday: number;

  @Field(() => Int)
  pendingReviews: number;

  @Field(() => Int)
  flaggedReviews: number;

  @Field(() => Int)
  totalMovies: number;

  @Field(() => Int)
  totalLists: number;

  @Field(() => Int)
  totalWatches: number;
}

@ObjectType()
export class ModerationStats {
  @Field(() => Int)
  pendingReports: number;

  @Field(() => Int)
  resolvedReports: number;

  @Field(() => Int)
  moderationLogsToday: number;

  @Field(() => Int)
  totalModerationLogs: number;
}

@ObjectType()
export class AdminDashboardStats {
  @Field(() => UserStats)
  users: UserStats;

  @Field(() => ContentStats)
  content: ContentStats;

  @Field(() => ModerationStats)
  moderation: ModerationStats;
}