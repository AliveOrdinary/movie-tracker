// src/auth/decorators/auth.decorator.ts
import { applyDecorators, UseGuards, SetMetadata } from '@nestjs/common';
import { GqlAuthGuard } from '../guards/gql-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { UserRole } from '../../common/enums';
import { ROLES_KEY } from '../guards/roles.guard';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Combined decorator for authentication and role-based authorization
 * @param roles Optional roles to restrict access to
 */
export function Auth(...roles: UserRole[]) {
  return applyDecorators(
    SetMetadata(ROLES_KEY, roles),
    UseGuards(GqlAuthGuard, RolesGuard)
  );
}

/**
 * Decorator to mark a route as public (no authentication required)
 */
export function Public() {
  return SetMetadata(IS_PUBLIC_KEY, true);
}
