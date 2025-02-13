//src/modules/users/dto/create-user.input.ts
import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsString, MinLength } from 'class-validator';

@InputType()
export class CreateUserInput {
  @Field()
  @IsString()
  @MinLength(3)
  username: string;

  @Field()
  @IsEmail()
  email: string;

  @Field()
  firebaseUid: string;

  @Field(() => String, { nullable: true })
  displayName?: string;
}