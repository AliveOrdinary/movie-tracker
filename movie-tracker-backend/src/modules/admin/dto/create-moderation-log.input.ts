//src/modules/admin/dto/create-moderation-log.input.ts
import { InputType, Field } from '@nestjs/graphql';
import { IsEnum, IsUUID, IsString, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
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

  @Field(() => String, { nullable: true })
  @IsOptional()
  notes?: string;
}