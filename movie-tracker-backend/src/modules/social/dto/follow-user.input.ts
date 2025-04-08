// src/modules/social/dto/follow-user.input.ts
import { InputType, Field } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';

@InputType()
export class FollowUserInput {
  @Field()
  @IsUUID()
  userId: string;
}