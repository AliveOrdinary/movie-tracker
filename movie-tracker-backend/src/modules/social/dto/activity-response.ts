// src/modules/social/dto/activity-response.ts
import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Activity } from '../entities/activity.entity';

@ObjectType()
export class ActivityResponse {
  @Field(() => [Activity])
  items: Activity[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  totalPages: number;
}