// src/auth/dto/login.dto.ts
import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsString } from 'class-validator';
import { User } from '../../modules/users/entities/user.entity';

@InputType()
export class LoginInput {
  @Field()
  @IsString()
  firebaseUid: string;
}

@ObjectType()
export class LoginResponse {
  @Field(() => User)
  user: User;

  @Field(() => String, { nullable: true })
  token?: string;
}