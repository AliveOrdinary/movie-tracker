// src/auth/dto/email-verification.dto.ts
import { InputType, Field, ObjectType } from '@nestjs/graphql';
import { IsString, IsEmail } from 'class-validator';

@InputType()
export class SendEmailVerificationInput {
  @Field()
  @IsEmail()
  email: string;
}

@ObjectType()
export class EmailVerificationResult {
  @Field()
  success: boolean;

  @Field(() => String, { nullable: true })
  message?: string;
}
