import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { UserRole } from '../../common/enums';
import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY } from './auth.guard';

/**
 * Metadata key for role-based authorization
 */
export const ROLES_KEY = 'roles';

/**
 * Decorator to specify required roles for a route
 * @param roles The roles required to access the route
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

/**
 * Guard that checks if the user has the required roles
 */
@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  /**
   * Checks if the user has the required roles
   * @param context The execution context
   * @returns Boolean indicating if the user has the required roles
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext();

    // First, check if endpoint is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Check for public operations by operation name
    const operationName = req.body?.operationName;
    const publicOperations = [
      'PopularMovies',
      'SearchMovies',
      'GetMovieDetails',
      'Movie',
      'MoviesByGenre',
      'SimilarMovies',
      'RecommendedMovies',
      'MovieGenres',
      'NowPlayingMovies',
      'UpcomingMovies',
      'TopRatedMovies',
      'TrendingMovies',
      'DiscoverMovies',
      'Login'
    ];

    // Allow access if the endpoint is marked as public or the operation is public
    if (isPublic || (operationName && publicOperations.includes(operationName))) {
      return true;
    }

    // Get required roles from metadata
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are required and the endpoint is not public,
    // we still need to check if user is authenticated
    if (!requiredRoles || requiredRoles.length === 0) {
      if (!req.user) {
        this.logger.warn('No user found in request for protected endpoint');
        throw new ForbiddenException('Authentication required');
      }
      return true;
    }

    // If user doesn't exist or has no roles, deny access
    if (!req.user || !Array.isArray(req.user.roles)) {
      this.logger.warn('User or roles not found in request');
      throw new ForbiddenException('Authentication required');
    }

    // Check if user has any of the required roles
    const hasRole = requiredRoles.some(role => req.user.roles.includes(role));

    if (!hasRole) {
      this.logger.warn(
        `User ${req.user.id} attempted to access resource requiring roles: ${requiredRoles.join(', ')}`
      );
      throw new ForbiddenException(
        `Access denied. Required roles: ${requiredRoles.join(', ')}`
      );
    }

    return true;
  }
}