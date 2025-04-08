// src/modules/admin/dto/content-management.dto.ts
import { InputType, ObjectType, Field, Int } from '@nestjs/graphql';
import { IsEnum, IsOptional, IsString, IsUUID, MinLength, IsInt, Min, Max } from 'class-validator';
import { Review } from '../../reviews/entities/review.entity';
import { ModerationAction } from '../../../common/enums';

@InputType()
export class ModerateContentInput {
  @Field()
  @IsUUID()
  contentId: string;

  @Field(() => ModerationAction)
  @IsEnum(ModerationAction)
  action: ModerationAction;

  @Field({ nullable: true })
  @IsString()
  @MinLength(10)
  @IsOptional()
  reason?: string;
}

@InputType()
export class GetFlaggedContentInput {
  @Field(() => Int, { defaultValue: 1 })
  @IsInt()
  @Min(1)
  page: number;

  @Field(() => Int, { defaultValue: 10 })
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number;
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

@ObjectType()
export class ContentModerationStats {
  @Field(() => Int)
  totalFlagged: number;

  @Field(() => Int)
  pendingModeration: number;

  @Field(() => Int)
  moderatedToday: number;

  @Field(() => Int)
  totalModerated: number;
}