// src/modules/users/dto/update-user.input.ts
import { InputType, Field, PartialType } from '@nestjs/graphql';
import { CreateUserInput } from './create-user.input';
import { IsString, IsOptional, IsUrl, IsArray, IsBoolean, IsDate } from 'class-validator';

@InputType()
export class UpdateUserInput extends PartialType(CreateUserInput) {
  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  emailVerified?: boolean;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  bio?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  location?: string;

  @Field(() => String, { nullable: true })
  @IsUrl()
  @IsOptional()
  website?: string;

  @Field(() => [String], { nullable: true })
  @IsArray()
  @IsOptional()
  favoriteGenres?: string[];

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  showOnlineStatus?: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  showActivity?: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  allowFriendRequests?: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  showWatchlist?: boolean;

  @Field(() => Date, { nullable: true })
  @IsDate()
  @IsOptional()
  lastActivityAt?: Date;
}