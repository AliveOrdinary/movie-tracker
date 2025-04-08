// src/modules/lists/dto/create-list.input.ts
import { InputType, Field } from '@nestjs/graphql';
import { ListPrivacy, ListType } from 'src/common/enums';
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
  @IsEnum(ListType, {
    message: 'Type must be a valid list type (STANDARD or CUSTOM)'
  })
  type: ListType = ListType.CUSTOM;

  @Field(() => ListPrivacy)
  @IsEnum(ListPrivacy, {
    message: 'Privacy must be a valid privacy setting (PUBLIC, PRIVATE, or FOLLOWING)'
  })
  privacy: ListPrivacy = ListPrivacy.PRIVATE;

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