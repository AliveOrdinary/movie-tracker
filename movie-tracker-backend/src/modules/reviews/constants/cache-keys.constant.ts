// src/modules/reviews/constants/cache-keys.constant.ts

/**
 * Constant cache key generators for review-related caching
 * These will be deprecated in favor of the CacheKeyFactory approach
 */
export const CACHE_KEYS = {
  // Single entities
  REVIEW_DETAILS: (reviewId: string) => `review:details:${reviewId}`,
  
  // Collections
  MOVIE_REVIEWS: (movieId: string, page = 1, limit = 10) => 
    `review:movie:${movieId}:page:${page}:limit:${limit}`,
  USER_REVIEWS: (userId: string, page = 1, limit = 10) => 
    `review:user:${userId}:page:${page}:limit:${limit}`,
  
  // Statistics
  REVIEW_STATS: (movieId: string) => `review:stats:movie:${movieId}`,
  USER_STATS: (userId: string) => `review:stats:user:${userId}`,
  
  // Reactions
  REACTIONS: (reviewId: string) => `review:reactions:${reviewId}`,
  USER_REACTION: (reviewId: string, userId: string) => `review:reaction:${reviewId}:user:${userId}`,
  
  // User-movie specific
  USER_MOVIE_REVIEW: (userId: string, movieId: string) => `review:user:${userId}:movie:${movieId}`,
} as const;
