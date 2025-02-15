// src/modules/reviews/constants/cache-keys.constant.ts
export const CACHE_KEYS = {
    MOVIE_REVIEWS: (movieId: string) => `reviews:movie:${movieId}`,
    USER_REVIEWS: (userId: string) => `reviews:user:${userId}`,
    REVIEW_STATS: (movieId: string) => `reviews:stats:${movieId}`,
    USER_STATS: (userId: string) => `reviews:stats:user:${userId}`,
    REACTIONS: (reviewId: string) => `reviews:reactions:${reviewId}`,
  } as const;
  