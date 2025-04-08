// src/modules/admin/dto/system-stats.dto.ts
import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
class MemoryUsage {
  @Field(() => Int)
  rss: number;

  @Field(() => Int)
  heapTotal: number;

  @Field(() => Int)
  heapUsed: number;
  
  @Field(() => Int)
  external: number;
}

@ObjectType()
class SystemInfo {
  @Field(() => Int)
  uptime: number;
  
  @Field(() => MemoryUsage)
  memoryUsage: MemoryUsage;
  
  @Field()
  version: string;
  
  @Field()
  platform: string;
  
  @Field()
  nodeEnv: string;
}

@ObjectType()
class DatabaseEntityCounts {
  @Field(() => Int)
  users: number;
  
  @Field(() => Int)
  reviews: number;
  
  @Field(() => Int)
  movies: number;
  
  @Field(() => Int)
  lists: number;
  
  @Field(() => Int)
  watchHistory: number;
  
  @Field(() => Int)
  activities: number;
  
  @Field(() => Int)
  notifications: number;
  
  @Field(() => Int)
  reports: number;
}

@ObjectType()
class DatabaseInfo {
  @Field(() => DatabaseEntityCounts)
  entities: DatabaseEntityCounts;
  
  @Field(() => Int)
  totalEntities: number;
}

@ObjectType()
export class SystemStatsDto {
  @Field(() => SystemInfo)
  system: SystemInfo;
  
  @Field(() => DatabaseInfo)
  database: DatabaseInfo;
}