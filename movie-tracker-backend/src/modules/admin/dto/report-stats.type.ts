//src/modules/admin/dto/report-stats.type.ts
import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class ReportStats {
  @Field(() => Int)
  totalReports: number;

  @Field(() => Int)
  pendingReports: number;

  @Field(() => Int)
  resolvedReports: number;

  @Field(() => Int)
  dismissedReports: number;
}