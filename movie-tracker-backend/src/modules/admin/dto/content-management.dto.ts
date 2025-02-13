//src/modules/admin/dto/content-management.dto.ts
import { InputType, ObjectType, Field, Int, registerEnumType } from '@nestjs/graphql';
import { IsEnum, IsOptional, IsString, MinLength, IsInt, Min } from 'class-validator';
import { Review } from '../../reviews/entities/review.entity';

export enum ModerationType {
  REVIEW = 'REVIEW',
  COMMENT = 'COMMENT',
  USER_PROFILE = 'USER_PROFILE'
}

export enum ModerationAction {
  APPROVE = 'APPROVE',
  REMOVE = 'REMOVE',
  FLAG = 'FLAG'
}

registerEnumType(ModerationType, {
  name: 'ModerationType',
  description: 'Type of content being moderated',
});

registerEnumType(ModerationAction, {
  name: 'ModerationAction',
  description: 'Action taken by moderator',
});

@InputType()
export class ModerateContentInput {
  @Field()
  @IsString()
  contentId: string;

  @Field(() => ModerationType)
  @IsEnum(ModerationType)
  contentType: ModerationType;

  @Field(() => ModerationAction)
  @IsEnum(ModerationAction)
  action: ModerationAction;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(10)
  reason?: string;
}

@ObjectType()
export class PaginatedReviews {
  @Field(() => [Review])
  reviews: Review[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  totalPages: number;
}

@InputType()
export class GetFlaggedContentInput {
  @Field(() => ModerationType)
  @IsEnum(ModerationType)
  contentType: ModerationType;

  @Field(() => Int, { defaultValue: 1 })
  @IsInt()
  @Min(1)
  page: number;

  @Field(() => Int, { defaultValue: 10 })
  @IsInt()
  @Min(1)
  limit: number;
}

@ObjectType()
export class ModerationLog {
  @Field()
  id: string;

  @Field(() => ModerationType)
  contentType: ModerationType;

  @Field()
  contentId: string;

  @Field(() => ModerationAction)
  action: ModerationAction;

  @Field({ nullable: true })
  reason?: string;

  @Field()
  moderatorId: string;

  @Field()
  createdAt: Date;
}