// src/modules/social/dto/social-group.dto.ts
import { ObjectType, Field, Int } from '@nestjs/graphql';
import { SocialGroup } from '../entities/social-group.entity';

@ObjectType()
export class SocialGroupResponse {
  @Field(() => [SocialGroup])
  items: SocialGroup[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  totalPages: number;
}
