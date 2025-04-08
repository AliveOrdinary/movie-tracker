// src/modules/reviews/dto/add-reaction.input.ts
import { InputType, Field } from '@nestjs/graphql';
import { IsUUID, IsEnum } from 'class-validator';
import { ReactionType } from 'src/common/enums';

@InputType()
export class AddReactionInput {
  @Field()
  @IsUUID()
  reviewId: string;

  @Field(() => ReactionType)
  @IsEnum(ReactionType)
  type: ReactionType;
}
