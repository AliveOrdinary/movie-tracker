// src/modules/reviews/dto/remove-reaction.input.ts
import { InputType, Field } from '@nestjs/graphql';
import { IsUUID, IsEnum } from 'class-validator';
import { ReactionType } from 'src/common/enums';

@InputType()
export class RemoveReactionInput {
  @Field()
  @IsUUID()
  reviewId: string;

  @Field(() => ReactionType)
  @IsEnum(ReactionType)
  type: ReactionType;
}
