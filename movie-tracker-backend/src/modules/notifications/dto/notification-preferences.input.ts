// src/modules/notifications/dto/notification-preferences.input.ts
import { InputType, Field } from '@nestjs/graphql';
import { IsBoolean, IsOptional, IsEnum } from 'class-validator';
import { NotificationType } from '../entities/notification.entity';

@InputType()
export class NotificationPreferencesInput {
  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  pushNotifications?: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  reviewNotifications?: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  friendRequestNotifications?: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  watchlistNotifications?: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  movieReleaseNotifications?: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  systemNotifications?: boolean;

  @Field(() => [NotificationType], { nullable: true })
  @IsOptional()
  @IsEnum(NotificationType, { each: true })
  disabledTypes?: NotificationType[];
}