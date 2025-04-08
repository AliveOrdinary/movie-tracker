// src/modules/admin/dto/time-series.dto.ts
import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class TimeSeriesData {
  @Field(() => [String])
  labels: string[];

  @Field(() => [Int])
  series: number[];

  @Field()
  timeframe: string;

  @Field(() => Int)
  period: number;
}