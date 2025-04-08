// src/modules/social/dto/create-reaction.input.ts
import { InputType, Field } from '@nestjs/graphql';
import { IsUUID, IsEnum } from 'class-validator';
import { ReactionType } from '../../../common/enums';

@InputType()
export class CreateReactionInput {
  @Field()
  @IsUUID()
  activityId: string;

  @Field(() => ReactionType)
  @IsEnum(ReactionType)
  type: ReactionType;
}
