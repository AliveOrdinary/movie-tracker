// src/modules/social/dto/update-social-group.input.ts
import { InputType, Field } from '@nestjs/graphql';
import { IsString, MaxLength, MinLength, IsEnum, IsOptional, ArrayMaxSize } from 'class-validator';
import { GroupPrivacy } from '../../../common/enums';

@InputType()
export class UpdateSocialGroupInput {
  @Field({ nullable: true })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @IsOptional()
  name?: string;

  @Field({ nullable: true })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  description?: string;

  @Field(() => GroupPrivacy, { nullable: true, name: 'SocialGroupPrivacy' })
  @IsEnum(GroupPrivacy)
  @IsOptional()
  privacy?: GroupPrivacy;

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
