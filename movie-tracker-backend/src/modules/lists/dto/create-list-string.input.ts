// src/modules/lists/dto/create-list-string.input.ts
import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsOptional, MaxLength, IsInt, Min, Max } from 'class-validator';

@InputType()
export class CreateListStringInput {
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

  @Field()
  @IsString()
  type: string;

  @Field()
  @IsString()
  privacy: string;

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