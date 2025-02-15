// src/modules/watch-history/dto/update-watch.input.ts
import { InputType, Field, Int, Float } from '@nestjs/graphql';
import { IsDate, IsEnum, IsOptional, IsBoolean, IsNumber, Min, Max } from 'class-validator';
import { WatchType } from '../entities/watch-history.entity';

@InputType()
export class UpdateWatchInput {
  @Field(() => Date, { nullable: true })
  @IsOptional()
  @IsDate()
  watchedAt?: Date;

  @Field(() => WatchType, { nullable: true })
  @IsOptional()
  @IsEnum(WatchType)
  watchType?: WatchType;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  rating?: number;

  @Field({ nullable: true })
  @IsOptional()
  notes?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  watchDuration?: number;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;
}