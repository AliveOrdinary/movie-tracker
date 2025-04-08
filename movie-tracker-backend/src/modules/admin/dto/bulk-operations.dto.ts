// src/modules/admin/dto/bulk-operations.dto.ts
import { InputType, Field, ObjectType, Int } from '@nestjs/graphql';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole, ModerationAction } from 'src/common/enums';

@InputType()
export class BulkUserRoleInput {
  @Field(() => [String])
  @IsArray()
  userIds: string[];

  @Field(() => UserRole)
  @IsEnum(UserRole)
  role: UserRole;

  @Field()
  add: boolean;
}

@InputType()
export class BulkUserModerationInput {
  @Field(() => [String])
  @IsArray()
  userIds: string[];

  @Field(() => ModerationAction)
  @IsEnum(ModerationAction)
  action: ModerationAction;

  @Field()
  @IsString()
  reason: string;
}

@ObjectType('UserBulkOperationResult')
export class BulkOperationResult {
  @Field(() => Int)
  successCount: number;

  @Field(() => Int)
  failureCount: number;

  @Field(() => [String], { nullable: true })
  errors?: string[];
}
