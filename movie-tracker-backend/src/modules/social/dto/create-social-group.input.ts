// src/modules/social/dto/create-social-group.input.ts
import { InputType, Field } from '@nestjs/graphql';
import { IsString, MaxLength, MinLength, IsEnum, IsOptional, ArrayMaxSize } from 'class-validator';
import { GroupPrivacy } from '../../../common/enums';

@InputType()
export class CreateSocialGroupInput {
  @Field()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  name: string;

  @Field()
  @IsString()
  @MaxLength(500)
  description: string;

  @Field(() => GroupPrivacy, { name: 'SocialGroupPrivacy' })
  @IsEnum(GroupPrivacy)
  privacy: GroupPrivacy;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  imageUrl?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @ArrayMaxSize(10)
  tags?: string[];
}
