//src/common/enums/roles.enum.ts
import { registerEnumType } from '@nestjs/graphql';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
}

registerEnumType(UserRole, {
  name: 'UserRole', // This is the name that will be used in the GraphQL schema
  description: 'User role enumeration',
});
