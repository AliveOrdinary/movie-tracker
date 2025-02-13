//src/common/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { UserRole } from '../enums/roles.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { InsufficientPermissionsException } from '../exceptions/auth.exceptions';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are required, allow access
    if (!requiredRoles) {
      return true;
    }

    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext();
    const user = req.user;

    if (!user || !user.roles) {
      this.logger.warn('User or roles not found in request');
      throw new InsufficientPermissionsException();
    }

    const hasRole = requiredRoles.some(role => 
      user.roles.includes(role)
    );

    if (!hasRole) {
      this.logger.warn(`User ${user.uid} attempted to access resource requiring roles: ${requiredRoles}`);
      throw new InsufficientPermissionsException(`Required roles: ${requiredRoles.join(', ')}`);
    }

    return true;
  }
}
