// src/modules/reviews/dto/add-reaction.input.ts
import { InputType, Field } from '@nestjs/graphql';
import { IsUUID, IsEnum } from 'class-validator';
import { ReactionType } from '../entities/review-reaction.entity';

@InputType()
export class AddReactionInput {
  @Field()
  @IsUUID()
  reviewId: string;

  @Field(() => ReactionType)
  @IsEnum(ReactionType)
  type: ReactionType;
}
