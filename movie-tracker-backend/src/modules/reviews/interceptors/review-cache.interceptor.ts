// src/modules/reviews/interceptors/review-cache.interceptor.ts
import { CacheInterceptor, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Injectable, ExecutionContext, Logger, Inject } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Reflector } from '@nestjs/core';
import { CacheKeyFactory } from '../../../common/factories/cache-key.factory';
import { entityCacheTTLSeconds } from '../../../common/constants/cache-ttl.constants';

/**
 * Enhanced cache interceptor for GraphQL review queries that
 * generates appropriate cache keys based on the query parameters.
 */
@Injectable()
export class ReviewCacheInterceptor extends CacheInterceptor {
  private readonly logger = new Logger(ReviewCacheInterceptor.name);
  
  constructor(
    @Inject(CACHE_MANAGER) cacheManager: any,
    reflector: Reflector,
    private readonly cacheKeyFactory: CacheKeyFactory
  ) {
    super(cacheManager, reflector);
  }
  
  /**
   * Generates cache keys for review-related GraphQL operations
   */
  trackBy(context: ExecutionContext): string | undefined {
    try {
      const ctx = GqlExecutionContext.create(context);
      const info = ctx.getInfo();
      const args = ctx.getArgs();
      
      // Get operation name (the GraphQL query/mutation name)
      const operationName = info.fieldName;
      
      switch (operationName) {
        case 'review':
          // Single review query
          return this.cacheKeyFactory.review.details(args.id);
          
        case 'movieReviews':
          // List of movie reviews
          const { movieId, filters = {} } = args;
          const { page = 1, limit = 10 } = filters;
          return this.cacheKeyFactory.review.movieReviews(movieId);
          
        case 'myReviews':
        case 'userReviews':
          // List of user reviews
          const userId = args.userId || (ctx.getContext().req?.user?.id);
          if (!userId) return undefined;
          
          const { page: userPage = 1, limit: userLimit = 10 } = args.filters || {};
          return this.cacheKeyFactory.review.userReviews(userId);
          
        case 'movieReviewStats': 
          // Movie review statistics
          return this.cacheKeyFactory.review.movieStats(args.movieId);
          
        case 'userReviewStats':
          // User review statistics
          const statsUserId = args.userId || (ctx.getContext().req?.user?.id);
          if (!statsUserId) return undefined;
          return this.cacheKeyFactory.review.userStats(statsUserId);
          
        case 'reactionStats':
          // Reaction statistics for a review
          return this.cacheKeyFactory.review.reactions(args.reviewId);
        
        case 'userReaction':
          // User's reaction to a review
          const reactionUserId = args.userId || (ctx.getContext().req?.user?.id);
          if (!reactionUserId) return undefined;
          return this.cacheKeyFactory.generate('review', 'userReaction', [args.reviewId, reactionUserId]);
          
        default:
          // Don't cache other operations
          return undefined;
      }
    } catch (error) {
      // Log error but don't prevent operation from executing
      this.logger.error(`Error generating cache key: ${error.message}`, error.stack);
      return undefined;
    }
  }
  
  /**
   * Determine TTL based on operation type
   */
  getTTL(context: ExecutionContext): number {
    const ctx = GqlExecutionContext.create(context);
    const info = ctx.getInfo();
    const operationName = info.fieldName;
    
    switch (operationName) {
      case 'movieReviews':
      case 'myReviews':
      case 'userReviews':
        return entityCacheTTLSeconds.USER_REVIEW;
      case 'review':
        return entityCacheTTLSeconds.REVIEW_DETAILS;
      case 'movieReviewStats':
        return entityCacheTTLSeconds.MOVIE_REVIEW_STATS;
      case 'userReviewStats':
      case 'reactionStats':
      case 'userReaction':
        return entityCacheTTLSeconds.REVIEW_STATS;
      default:
        return 60; // 1 minute default
    }
  }
}