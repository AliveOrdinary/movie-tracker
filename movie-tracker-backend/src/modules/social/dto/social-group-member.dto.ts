// src/modules/social/dto/social-group-member.dto.ts
import { ObjectType, Field, Int } from '@nestjs/graphql';
import { SocialGroupMember } from '../entities/social-group-member.entity';

@ObjectType()
export class SocialGroupMemberResponse {
  @Field(() => [SocialGroupMember])
  items: SocialGroupMember[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  totalPages: number;
}
