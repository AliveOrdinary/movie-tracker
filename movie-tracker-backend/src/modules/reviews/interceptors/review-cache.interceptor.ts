// src/modules/reviews/interceptors/review-cache.interceptor.ts
import { CacheInterceptor } from '@nestjs/cache-manager';
import { Injectable, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class ReviewCacheInterceptor extends CacheInterceptor {
  trackBy(context: ExecutionContext): string | undefined {
    const ctx = GqlExecutionContext.create(context);
    const { movieId, userId } = ctx.getArgs();
    
    if (movieId) {
      return `reviews:movie:${movieId}`;
    }
    if (userId) {
      return `reviews:user:${userId}`;
    }
    
    return undefined;
  }
}