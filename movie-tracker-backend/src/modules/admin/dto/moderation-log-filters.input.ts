//src/modules/admin/dto/moderation-log-filters.input.ts
import { InputType, Field, Int } from '@nestjs/graphql';
import { IsEnum, IsUUID, IsOptional, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { ModerationAction } from '../entities/moderation-log.entity';

@InputType()
export class ModerationLogFiltersInput {
  @Field(() => ModerationAction, { nullable: true })
  @IsEnum(ModerationAction)
  @IsOptional()
  action?: ModerationAction;

  @Field({ nullable: true })
  @IsUUID()
  @IsOptional()
  targetUserId?: string;

  @Field({ nullable: true })
  @IsUUID()
  @IsOptional()
  targetReviewId?: string;

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  isResolved?: boolean;

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  skip?: number;

  @Field(() => Int, { nullable: true, defaultValue: 10 })
  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  take?: number;
}