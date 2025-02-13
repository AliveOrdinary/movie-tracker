//src/modules/admin/dto/user-management.dto.ts
import { InputType, ObjectType, Field, Int } from '@nestjs/graphql';
import { IsEnum, IsOptional, IsString, MinLength, IsInt, Min, IsNotEmpty } from 'class-validator';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../../../common/enums/roles.enum';

@InputType()
export class UpdateUserRoleInput {
  @Field()
  @IsString()
  userId: string;

  @Field(() => UserRole)
  @IsEnum(UserRole)
  role: UserRole;
}

@InputType()
export class BanUserInput {
  @Field()
  @IsString()
  userId: string;

  @Field()
  @IsNotEmpty()
  reason: string;
}

@InputType()
export class SearchUsersInput {
  @Field()
  @IsString()
  @MinLength(2)
  query: string;

  @Field(() => Int, { defaultValue: 1 })
  @IsInt()
  @Min(1)
  page: number;

  @Field(() => Int, { defaultValue: 10 })
  @IsInt()
  @Min(1)
  limit: number;
}

@ObjectType()
export class PaginatedUsers {
  @Field(() => [User])
  users: User[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  totalPages: number;
}