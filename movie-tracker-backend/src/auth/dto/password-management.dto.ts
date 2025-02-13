// src/auth/dto/password-management.dto.ts
import { InputType, Field, ObjectType } from '@nestjs/graphql';
import { IsEmail, IsString, MinLength, Matches } from 'class-validator';

@InputType()
export class InitiatePasswordResetInput {
  @Field()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;
}

@InputType()
export class ResetPasswordInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(
    /((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/,
    { message: 'Password is too weak' }
  )
  newPassword: string;
}

@InputType()
export class ChangePasswordInput {
  @Field()
  @IsString()
  currentPassword: string;

  @Field()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(
    /((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/,
    { message: 'Password is too weak' }
  )
  newPassword: string;
}

@ObjectType()
export class PasswordResetVerificationResult {
  @Field()
  email: string;

  @Field()
  isValid: boolean;
}