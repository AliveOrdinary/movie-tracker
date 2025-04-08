// src/modules/social/dto/activity-interaction.dto.ts
import { InputType, ObjectType, Field, Int } from '@nestjs/graphql';
import { IsUUID, IsString, IsEnum, IsOptional, MaxLength } from 'class-validator';
import { ActivityComment } from '../entities/activity-comment.entity';
import { ReactionType } from '../../../common/enums';

@InputType()
export class AddCommentInput {
  @Field()
  @IsUUID()
  activityId: string;

  @Field()
  @IsString()
  @MaxLength(500)
  content: string;
}

@InputType()
export class UpdateCommentInput {
  @Field()
  @IsUUID()
  commentId: string;

  @Field()
  @IsString()
  @MaxLength(500)
  content: string;
}

@InputType()
export class AddReactionInput {
  @Field()
  @IsUUID()
  activityId: string;

  @Field(() => ReactionType)
  @IsEnum(ReactionType)
  type: ReactionType;
}

@ObjectType()
export class ActivityCommentResponse {
  @Field(() => [ActivityComment])
  items: ActivityComment[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  totalPages: number;
}

@ObjectType()
export class ReactionSummary {
  @Field(() => ReactionType)
  type: ReactionType;

  @Field(() => Int)
  count: number;
}
