// src/modules/moderation/dto/auto-moderation-rule.dto.ts
import { InputType, Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { IsEnum, IsString, IsInt, Min, Max, IsOptional, IsBoolean, IsUUID } from 'class-validator';
import { RuleType, RuleAction, AutoModerationRule } from '../entities/auto-moderation-rule.entity';
import { ContentType } from '../entities/moderation-queue.entity';

@InputType()
export class CreateAutoModerationRuleInput {
  @Field()
  @IsString()
  name: string;

  @Field()
  @IsString()
  description: string;

  @Field(() => RuleType)
  @IsEnum(RuleType)
  ruleType: RuleType;

  @Field(() => ContentType)
  @IsEnum(ContentType)
  contentType: ContentType;

  @Field(() => RuleAction)
  @IsEnum(RuleAction)
  action: RuleAction;

  @Field(() => String, { description: 'JSON string pattern for rule matching' })
  pattern: string;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  threshold?: number = 50;

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}

@InputType()
export class UpdateAutoModerationRuleInput {
  @Field()
  @IsUUID()
  id: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  name?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field(() => RuleAction, { nullable: true })
  @IsEnum(RuleAction)
  @IsOptional()
  action?: RuleAction;

  @Field(() => String, { nullable: true, description: 'JSON string pattern for rule matching' })
  @IsOptional()
  pattern?: string;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  threshold?: number;

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
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




