// src/modules/social/dto/friend-request.dto.ts
import { ObjectType, Field, Int } from '@nestjs/graphql';
import { FriendRequest } from '../entities/friend-request.entity';

@ObjectType()
export class FriendRequestsResponse {
  @Field(() => [FriendRequest])
  items: FriendRequest[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  totalPages: number;
}
