// src/common/constants/cache.constants.ts
export const CACHE_KEYS = {
    // Auth
    AUTH: {
      TOKEN: (token: string) => `auth:token:${token}`,
      USER: (userId: string) => `auth:user:${userId}`,
      REFRESH_TOKEN: (userId: string) => `auth:refresh:${userId}`,
      BLACKLIST: (token: string) => `auth:blacklist:${token}`,
    },
    
    // Users
    USER: {
      PROFILE: (userId: string) => `user:profile:${userId}`,
      STATS: (userId: string) => `user:stats:${userId}`,
      ACTIVITY: (userId: string) => `user:activity:${userId}`,
      WATCH_HISTORY: (userId: string) => `user:watch-history:${userId}`,
      REVIEW_STATS: (userId: string) => `user:review-stats:${userId}`,
      REVIEW_DETAILS: (reviewId: string) => `user:review-details:${reviewId}`,
    },
  
    // Movies
    MOVIE: {
      DETAILS: (movieId: string) => `movie:details:${movieId}`,
      POPULAR: (page: number) => `movie:popular:${page}`,
      TRENDING: (timeWindow: string) => `movie:trending:${timeWindow}`,
      SEARCH: (query: string) => `movie:search:${query}`,
      MOVIE_STATS: (movieId: string) => `movie:stats:${movieId}`,
      USER_STATS: (userId: string) => `movie:user-stats:${userId}`,
      MOVIE_REVIEWS: (movieId: string) => `movie:reviews:${movieId}`,
      USER_REVIEWS: (userId: string) => `movie:user-reviews:${userId}`,
      ALL: (movieId: string, userId: string) => `movie:all:${movieId}:${userId}`,
    },
  
    // Reviews
    REVIEW: {
        ALL_REVIEWS: 'review:all', // For getting all reviews without filtering
        ALL_USER_MOVIE: (movieId: string, userId: string) => `review:all:${movieId}:${userId}`, // For specific user-movie combination
        MOVIE_REVIEWS: (movieId: string) => `review:movie:${movieId}`,
        USER_REVIEWS: (userId: string) => `review:user:${userId}`,
        STATS: (reviewId: string) => `review:stats:${reviewId}`,
        REACTIONS: (reviewId: string) => `review:reactions:${reviewId}`,
        MOVIE_STATS: (movieId: string) => `review:movie:stats:${movieId}`,
        USER_STATS: (userId: string) => `review:user:stats:${userId}`,
        DETAILS: (reviewId: string) => `review:details:${reviewId}`,
      },
  
    // Moderation
    MOD: {
      STATS: 'mod:stats',
      FLAGGED: (page: number) => `mod:flagged:${page}`,
      REPORTS: (status: string) => `mod:reports:${status}`,
    }
  } as const;
  
  export const CACHE_TTL = {
    SHORT: 300, // 5 minutes
    MEDIUM: 3600, // 1 hour
    LONG: 86400, // 24 hours
    VERY_LONG: 604800, // 7 days
  } as const;