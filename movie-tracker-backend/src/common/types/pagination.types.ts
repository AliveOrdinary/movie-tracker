// src/common/types/pagination.types.ts
import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
export abstract class PaginatedResponse<T> {
  @Field(() => [Object], { nullable: true })
  items: T[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  totalPages: number;
}