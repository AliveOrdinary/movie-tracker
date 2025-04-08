// src/modules/admin/dto/performance-metrics.dto.ts
import { ObjectType, Field, Float, Int } from '@nestjs/graphql';

@ObjectType()
class ApiResponseMetrics {
  @Field(() => Float)
  average: number;
  
  @Field(() => Float)
  p95: number;
  
  @Field(() => Float)
  p99: number;
}

@ObjectType()
class DatabaseMetrics {
  @Field(() => Int)
  queryCount: number;
  
  @Field(() => Float)
  averageQueryTime: number;
  
  @Field(() => Int)
  slowQueries: number;
}

@ObjectType()
class CacheMetrics {
  @Field(() => Float)
  hitRate: number;
  
  @Field(() => Float)
  missRate: number;
  
  @Field(() => Float)
  size: number;
}

@ObjectType()
export class PerformanceMetricsDto {
  @Field(() => ApiResponseMetrics)
  apiResponseTimes: ApiResponseMetrics;
  
  @Field(() => DatabaseMetrics)
  databaseMetrics: DatabaseMetrics;
  
  @Field(() => CacheMetrics)
  cacheMetrics: CacheMetrics;
  
  @Field(() => Float)
  errorRate: number;
}