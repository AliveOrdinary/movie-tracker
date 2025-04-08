// src/modules/notifications/dto/notification-filters.input.ts
import { InputType, Field, Int } from '@nestjs/graphql';
import { IsEnum, IsOptional, IsInt, Min, Max, IsBoolean } from 'class-validator';
import { NotificationType } from '../entities/notification.entity';

@InputType()
export class NotificationFiltersInput {
  @Field(() => [NotificationType], { nullable: true })
  @IsOptional()
  @IsEnum(NotificationType, { each: true })
  types?: NotificationType[];

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  unreadOnly?: boolean;

  @Field(() => Int, { nullable: true, defaultValue: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @Field(() => Int, { nullable: true, defaultValue: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;
}