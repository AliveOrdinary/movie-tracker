//src/modules/admin/dto/create-report.input.ts
import { InputType, Field } from '@nestjs/graphql';
import { IsUUID, IsString, MinLength } from 'class-validator';

@InputType()
export class CreateReportInput {
  @Field()
  @IsUUID()
  reviewId: string;

  @Field()
  @IsString()
  @MinLength(10)
  reason: string;
}