// src/modules/moderation/dto/report-response.dto.ts
import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Report } from '../entities/report.entity';

@ObjectType()
export class ReportResponse {
  @Field(() => [Report])
  items: Report[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Int)
  totalPages: number;
}
