import { 
  Injectable, 
  ExecutionContext, 
  UnauthorizedException, 
  Logger,
  ForbiddenException
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { FirebaseService } from '../../firebase/firebase.service';
import { UsersService } from '../../modules/users/users.service';
import { TokenService } from '../services/token.service';
import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key for public routes that skip authentication
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorator to mark routes as public (no authentication required)
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * Guard that handles authentication for both REST and GraphQL endpoints
 */
@Injectable()
export class AuthGuard {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
    private readonly reflector: Reflector,
  ) {}

  /**
   * List of operations that don't require authentication
   */
  private readonly publicOperations = [
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

  /**
   * Checks if the request is authenticated
   * @param context The execution context
   * @returns Boolean indicating if the request can proceed
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const ctx = GqlExecutionContext.create(context);
      const { req } = ctx.getContext();

      // Check if endpoint is marked as public
      const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

      // Check for public operations by operation name
      const operationName = req.body?.operationName;
      
      // Allow access if the endpoint is marked as public or the operation is public
      if (isPublic || (operationName && this.publicOperations.includes(operationName))) {
        // Add empty user object to request for consistency
        req.user = null;
        return true;
      }

      // Check for Authorization header
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        this.logger.warn('Missing authorization header');
        throw new UnauthorizedException('Authentication required');
      }

      // Extract and validate Bearer token
      const [type, token] = authHeader.split(' ');
      
      if (type !== 'Bearer' || !token) {
        this.logger.warn('Invalid authorization format');
        throw new UnauthorizedException('Invalid authorization format');
      }

      // Check if token is blacklisted
      const isBlacklisted = await this.tokenService.isTokenBlacklisted(token);
      if (isBlacklisted) {
        this.logger.warn('Attempt to use blacklisted token');
        throw new UnauthorizedException('Token has been revoked');
      }

      // Verify Firebase token
      const decodedToken = await this.firebaseService.auth.verifyIdToken(token);
      
      // Check if token is expired
      if (decodedToken.exp * 1000 < Date.now()) {
        this.logger.warn('Expired token');
        throw new UnauthorizedException('Token has expired');
      }
      
      // Get or create user in our database
      let user = await this.usersService.findByFirebaseUid(decodedToken.uid);
      
      if (!user) {
        if (!decodedToken.email) {
          throw new UnauthorizedException('Email is required');
        }

        user = await this.usersService.createFirebaseUser({
          firebaseUid: decodedToken.uid,
          email: decodedToken.email,
          displayName: decodedToken.name || decodedToken.email.split('@')[0],
          avatarUrl: decodedToken.picture,
        });
      }

      // Check if user is banned
      if (user.isBanned) {
        this.logger.warn(`Banned user attempted access: ${user.id}`);
        throw new ForbiddenException('Account has been banned');
      }

      // Check if user is suspended
      if (user.suspendedUntil && user.suspendedUntil > new Date()) {
        this.logger.warn(`Suspended user attempted access: ${user.id}`);
        throw new ForbiddenException(`Account suspended until ${user.suspendedUntil.toISOString()}`);
      }

      // Update last activity
      await this.usersService.update(user.id, {
        lastActivityAt: new Date(),
      });

      // Attach user to request
      req.user = user;
      
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof ForbiddenException) {
        throw error;
      }
      
      this.logger.error('Authentication failed:', error.message);
      this.logger.debug(error.stack);
      
      throw new UnauthorizedException('Authentication failed');
    }
  }
}