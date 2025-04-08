// src/modules/social/dto/create-comment.input.ts
import { InputType, Field } from '@nestjs/graphql';
import { IsUUID, IsString, MaxLength, MinLength } from 'class-validator';

@InputType()
export class CreateCommentInput {
  @Field()
  @IsUUID()
  activityId: string;

  @Field()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  content: string;

  @Field({ nullable: true })
  @IsUUID()
  parentCommentId?: string;
}
