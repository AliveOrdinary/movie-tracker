// src/modules/admin/dto/user-role-stats.dto.ts
import { ObjectType, Field, Int } from '@nestjs/graphql';
import { UserRole } from 'src/common/enums';

@ObjectType()
export class UserRoleStats {
  @Field(() => UserRole)
  role: UserRole;

  @Field(() => Int)
  count: number;

  @Field(() => Int)
  percentage: number;
}