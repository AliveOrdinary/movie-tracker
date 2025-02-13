//src/modules/users/dto/update-profile-customization.input.ts
import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsUrl, IsOptional, MaxLength, IsArray } from 'class-validator';

@InputType()
class SocialLinksInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUrl()
  twitter?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUrl()
  instagram?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUrl()
  facebook?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUrl()
  letterboxd?: string;
}

@InputType()
export class UpdateProfileCustomizationInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  website?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  favoriteGenres?: string[];

  @Field(() => SocialLinksInput, { nullable: true })
  @IsOptional()
  socialLinks?: SocialLinksInput;
}
