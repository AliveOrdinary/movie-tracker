// src/modules/social/dto/user-block.dto.ts
import { ObjectType, Field, Int } from '@nestjs/graphql';
import { UserBlock } from '../entities/user-block.entity';

@ObjectType()
export class UserBlockResponse {
  @Field(() => [UserBlock])
  items: UserBlock[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  totalPages: number;
}
