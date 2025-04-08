// src/auth/guards/public-aware-roles.guard.ts
import { 
  Injectable, 
  CanActivate, 
  ExecutionContext, 
  ForbiddenException, 
  Logger 
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { UserRole } from '../../common/enums';
import { ROLES_KEY } from './roles.guard';
import { IS_PUBLIC_KEY } from './auth.guard';

/**
 * Enhanced roles guard that respects the @Public() decorator
 */
@Injectable()
export class PublicAwareRolesGuard implements CanActivate {
  private readonly logger = new Logger(PublicAwareRolesGuard.name);

  // To fix TypeScript error when using global auth guards
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const handler = ctx.getHandler();
    const classRef = ctx.getClass();
    
    // Debug logging to see what's happening
    this.logger.debug(`PublicAwareRolesGuard: Processing ${classRef.name}.${handler.name}`);
    
    // First check if the endpoint is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      handler,
      classRef,
    ]);

    if (isPublic) {
      this.logger.log(`Allowing access to public endpoint: ${handler.name}`);
      return true;
    }

    // Also check for predefined public operations by name
    const gqlContext = ctx.getContext();
    const operationName = gqlContext?.req?.body?.operationName;
    
    this.logger.debug(`GraphQL Operation: ${operationName || 'Unknown'}`);
    if (gqlContext?.req?.body?.query) {
      this.logger.debug(`GraphQL Query: ${gqlContext.req.body.query.substring(0, 100)}...`);
    }
    const publicOperations = [
      'PopularMovies',
      'SearchMovies',
      'Movie',
      'GetMovieDetails',
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
    
    if (operationName && publicOperations.includes(operationName)) {
      this.logger.log(`Public operation detected: ${operationName} - skipping roles check`);
      return true;
    }

    // For protected endpoints, continue with role checking
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      handler,
      classRef,
    ]);

    // If no roles are required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Get the user from the request
    const { user } = ctx.getContext().req;

    // Check if user and roles are defined
    if (!user || !Array.isArray(user.roles)) {
      this.logger.warn('User or roles not found in request');
      throw new ForbiddenException('Insufficient permissions');
    }

    // Check if user has any of the required roles
    const hasRole = requiredRoles.some(role => user.roles.includes(role));

    // Log and throw error if user doesn't have required roles
    if (!hasRole) {
      this.logger.warn(
        `User ${user.id} attempted to access resource requiring roles: ${requiredRoles.join(', ')}`
      );
      
      throw new ForbiddenException(
        `Access denied. Required roles: ${requiredRoles.join(', ')}`
      );
    }

    return true;
  }
}
