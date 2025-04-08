// src/modules/admin/dto/admin-user-stats.dto.ts
import { ObjectType, Field, Int } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';

@ObjectType()
export class RegistrationStats {
  @Field(() => Int)
  total: number;

  @Field(() => Int)
  today: number;

  @Field(() => Int)
  lastWeek: number;

  @Field(() => Int)
  lastMonth: number;
}

@ObjectType()
export class ActivityStats {
  @Field(() => Int)
  activeToday: number;

  @Field(() => Int)
  activeLastWeek: number;

  @Field(() => Int)
  activeLastMonth: number;

  @Field(() => Int)
  neverActive: number;
}

@ObjectType()
export class TopReviewer {
  @Field()
  id: string;

  @Field()
  username: string;

  @Field({ nullable: true })
  avatarUrl?: string;

  @Field(() => Int)
  reviewCount: number;
}

@ObjectType('UserAdminStats')
export class AdminUserStats {
  @Field(() => RegistrationStats)
  registration: RegistrationStats;

  @Field(() => ActivityStats)
  activity: ActivityStats;

  @Field(() => [User])
  mostActiveUsers: User[];

  @Field(() => [TopReviewer])
  topReviewers: TopReviewer[];
}