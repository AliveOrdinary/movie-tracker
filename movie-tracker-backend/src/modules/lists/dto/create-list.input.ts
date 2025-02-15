// src/modules/lists/dto/create-list.input.ts
import { InputType, Field } from '@nestjs/graphql';
import { ListPrivacy, ListType } from '../entities/list.entity';
import { IsString, IsEnum, IsOptional, MaxLength, IsInt, Min, Max } from 'class-validator';

@InputType()
export class CreateListInput {
  @Field()
  @IsString()
  @MaxLength(100)
  name: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  thumbnail?: string;

  @Field(() => ListType)
  @IsEnum(ListType)
  type: ListType;

  @Field(() => ListPrivacy)
  @IsEnum(ListPrivacy)
  privacy: ListPrivacy;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  category?: string;

  @Field(() => Number, { nullable: true })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(100)
  maxEntries?: number;
}