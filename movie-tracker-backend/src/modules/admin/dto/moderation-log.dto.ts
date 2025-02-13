//src/modules/admin/dto/moderation-log.dto.ts
import { InputType, Field, Int } from '@nestjs/graphql';
import { IsEnum, IsUUID, IsString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ModerationAction } from '../entities/moderation-log.entity';

@InputType()
export class CreateModerationLogInput {
  @Field(() => ModerationAction)
  @IsEnum(ModerationAction)
  action: ModerationAction;

  @Field()
  @IsString()
  reason: string;

  @Field({ nullable: true })
  @IsUUID()
  @IsOptional()
  targetUserId?: string;

  @Field({ nullable: true })
  @IsUUID()
  @IsOptional()
  targetReviewId?: string;
}

@InputType()
export class UpdateModerationLogInput {
  @Field()
  @IsUUID()
  id: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  notes?: string;

  @Field({ nullable: true })
  @IsOptional()
  isResolved?: boolean;
}

@InputType()
export class ModerationLogFiltersInput {
  @Field({ nullable: true })
  @IsUUID()
  @IsOptional()
  targetUserId?: string;

  @Field({ nullable: true })
  @IsUUID()
  @IsOptional()
  targetReviewId?: string;

  @Field({ nullable: true })
  @IsOptional()
  isResolved?: boolean;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @Min(0)
  @IsOptional()
  skip?: number;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  take?: number;
}