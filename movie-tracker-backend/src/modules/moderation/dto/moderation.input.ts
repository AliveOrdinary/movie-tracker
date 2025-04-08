// src/modules/moderation/dto/moderation.input.ts
import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsUUID } from 'class-validator';

@InputType()
export class ResolveReportInput {
  @Field()
  @IsUUID()
  reportId: string;

  @Field()
  @IsString()
  action: string;

  @Field({ nullable: true })
  @IsString()
  moderatorNotes?: string;
}

@InputType()
export class ModerateReviewInput {
  @Field()
  @IsUUID()
  reviewId: string;

  @Field()
  @IsString()
  reason: string;
}