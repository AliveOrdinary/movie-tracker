// src/modules/lists/dto/update-list.input.ts
import { InputType, Field, ID } from '@nestjs/graphql';
import { ListPrivacy } from '../entities/list.entity';
import { IsString, IsEnum, IsOptional, MaxLength, IsUUID } from 'class-validator';

@InputType()
export class UpdateListInput {
  @Field(() => ID)
  @IsUUID()
  id: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  thumbnail?: string;

  @Field(() => ListPrivacy, { nullable: true })
  @IsEnum(ListPrivacy)
  @IsOptional()
  privacy?: ListPrivacy;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  category?: string;
}