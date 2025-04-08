// src/modules/moderation/dto/user-reputation.dto.ts
import { InputType, Field, ID, Float, Int } from '@nestjs/graphql';
import { IsEnum, IsUUID, IsNumber, IsString, IsOptional, Min, Max } from 'class-validator';
import { ReputationLevel, UserReputation } from '../entities/user-reputation.entity';

@InputType()
export class UpdateUserReputationInput {
  @Field()
  @IsUUID()
  userId: string;

  @Field(() => Float, { nullable: true })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  reputationScore?: number;

  @Field(() => ReputationLevel, { nullable: true })
  @IsEnum(ReputationLevel)
  @IsOptional()
  reputationLevel?: ReputationLevel;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  reason?: string;
}

@InputType()
export class ReputationAdjustmentInput {
  @Field()
  @IsUUID()
  userId: string;

  @Field(() => Float)
  @IsNumber()
  adjustment: number;

  @Field()
  @IsString()
  reason: string;
}

@InputType()
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




