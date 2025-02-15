// src/modules/reviews/dto/remove-reaction.input.ts
import { InputType, Field } from '@nestjs/graphql';
import { IsUUID, IsEnum } from 'class-validator';
import { ReactionType } from '../entities/review-reaction.entity';

@InputType()
export class RemoveReactionInput {
  @Field()
  @IsUUID()
  reviewId: string;

  @Field(() => ReactionType)
  @IsEnum(ReactionType)
  type: ReactionType;
}
