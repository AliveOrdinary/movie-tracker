// src/auth/dto/email-verification.dto.ts
import { InputType, Field, ObjectType } from '@nestjs/graphql';
import { IsString, IsEmail } from 'class-validator';

@InputType()
export class EmailVerificationInput {
  @Field()
  @IsString()
  code: string;
}

@ObjectType()
export class EmailVerificationResult {
  @Field()
  success: boolean;

  @Field(() => String, { nullable: true })
  message?: string;
}