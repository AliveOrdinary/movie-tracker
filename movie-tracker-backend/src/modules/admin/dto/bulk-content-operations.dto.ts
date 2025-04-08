// src/modules/admin/dto/bulk-content-operations.dto.ts
import { InputType, Field, ObjectType, Int } from '@nestjs/graphql';
import { IsArray, IsNotEmpty } from 'class-validator';

@InputType()
export class BulkContentOperationInput {
  @Field(() => [String])
  @IsArray()
  @IsNotEmpty()
  ids: string[];
}

@ObjectType('ContentBulkOperationResult')
export class BulkContentOperationResult {
  @Field(() => Int)
  successCount: number;

  @Field(() => Int)
  failureCount: number;

  @Field(() => [String], { nullable: true })
  errors?: string[];
}
