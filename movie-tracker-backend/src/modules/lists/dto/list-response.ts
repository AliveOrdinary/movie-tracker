// src/modules/lists/dto/list-response.ts
import { ObjectType, Field, Int } from '@nestjs/graphql';
import { List } from '../entities/list.entity';

@ObjectType()
export class ListResponse {
  @Field(() => [List])
  items: List[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  totalPages: number;
}