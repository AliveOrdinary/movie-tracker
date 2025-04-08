// src/common/constants/cache-ttl.constants.ts

/**
 * Centralized cache TTL (Time-To-Live) constants
 * All times in seconds
 */
export enum CacheTTL {
  // General TTL categories
  SHORT = 300,       // 5 minutes
  MEDIUM = 3600,     // 1 hour
  LONG = 86400,      // 24 hours
  VERY_LONG = 604800 // 7 days
}

/**
 * Entity-specific TTL values
 */
export const EntityCacheTTL = {

  SHORT: CacheTTL.SHORT,
  MEDIUM: CacheTTL.MEDIUM, 
  LONG: CacheTTL.LONG,
  VERY_LONG: CacheTTL.VERY_LONG,
  
  // User-related
  USER_PROFILE: CacheTTL.MEDIUM,
  USER_STATS: CacheTTL.SHORT,
  USER_ACTIVITY: CacheTTL.SHORT,
  USER_SETTINGS: CacheTTL.MEDIUM,
  
  // Authentication
  AUTH_TOKEN: 900,  // 15 minutes
  REFRESH_TOKEN: CacheTTL.LONG,
  
  // Movie-related
  MOVIE_DETAILS: CacheTTL.MEDIUM,
  MOVIE_CREDITS: CacheTTL.LONG,
  MOVIE_VIDEOS: CacheTTL.LONG,
  MOVIE_GENRES: CacheTTL.VERY_LONG,
  MOVIE_POPULAR: 1800,  // 30 minutes
  MOVIE_TRENDING: 1800, // 30 minutes
  MOVIE_SEARCH: CacheTTL.SHORT,
  MOVIE_SIMILAR: CacheTTL.MEDIUM,
  MOVIE_RECOMMENDATIONS: CacheTTL.MEDIUM,
  MOVIE_PROVIDERS: CacheTTL.LONG,
  MOVIE_UPCOMING: 1800, // 30 minutes
  MOVIE_TOP_RATED: CacheTTL.MEDIUM,
  MOVIE_NOW_PLAYING: 1800, // 30 minutes
  
  // Review-related
  REVIEW_DETAILS: CacheTTL.MEDIUM,
  USER_REVIEW: CacheTTL.SHORT,
  MOVIE_REVIEWS: CacheTTL.SHORT,
  REVIEW_STATS: CacheTTL.SHORT,
  MOVIE_REVIEW_STATS: CacheTTL.SHORT,
  
  // List-related
  LIST_DETAILS: CacheTTL.MEDIUM,
  LIST_ITEMS: CacheTTL.MEDIUM,
  POPULAR_LISTS: CacheTTL.SHORT,
  
  // Moderation
  MOD_STATS: CacheTTL.SHORT,
  MOD_REPORTS: CacheTTL.SHORT,
  MODERATION_QUEUE: CacheTTL.SHORT,
  MODERATION_RULE: CacheTTL.MEDIUM,
  MODERATION_LOG: CacheTTL.MEDIUM,
  
  // Admin Dashboard
  ADMIN_DASHBOARD: CacheTTL.SHORT,     // 5 minutes
  ADMIN_ANALYTICS: CacheTTL.MEDIUM,    // 1 hour
  ADMIN_TRENDING: 1800,                // 30 minutes
  ADMIN_CONTENT_STATS: CacheTTL.MEDIUM,
  
  // Default
  DEFAULT: CacheTTL.MEDIUM
};

/**
 * Raw seconds values for use in places where enum values are not accepted
 */
export const entityCacheTTLSeconds = {
  // User-related
  USER_PROFILE: CacheTTL.MEDIUM,
  USER_STATS: CacheTTL.SHORT,
  USER_ACTIVITY: CacheTTL.SHORT,
  USER_SETTINGS: CacheTTL.MEDIUM,
  
  // Authentication
  AUTH_TOKEN: 900,  // 15 minutes
  REFRESH_TOKEN: CacheTTL.LONG,
  
  // Movie-related
  MOVIE_DETAILS: CacheTTL.MEDIUM,
  MOVIE_CREDITS: CacheTTL.LONG,
  MOVIE_VIDEOS: CacheTTL.LONG,
  MOVIE_GENRES: CacheTTL.VERY_LONG,
  MOVIE_POPULAR: 1800,  // 30 minutes
  MOVIE_TRENDING: 1800, // 30 minutes
  MOVIE_SEARCH: CacheTTL.SHORT,
  MOVIE_SIMILAR: CacheTTL.MEDIUM,
  MOVIE_RECOMMENDATIONS: CacheTTL.MEDIUM,
  MOVIE_PROVIDERS: CacheTTL.LONG,
  MOVIE_UPCOMING: 1800, // 30 minutes
  MOVIE_TOP_RATED: CacheTTL.MEDIUM,
  MOVIE_NOW_PLAYING: 1800, // 30 minutes
  
  // Review-related
  REVIEW_DETAILS: CacheTTL.MEDIUM,
  USER_REVIEW: CacheTTL.SHORT,
  MOVIE_REVIEWS: CacheTTL.SHORT,
  REVIEW_STATS: CacheTTL.SHORT,
  MOVIE_REVIEW_STATS: CacheTTL.SHORT,
  
  // List-related
  LIST_DETAILS: CacheTTL.MEDIUM,
  LIST_ITEMS: CacheTTL.MEDIUM,
  POPULAR_LISTS: CacheTTL.SHORT,
  
  // Moderation
  MOD_STATS: CacheTTL.SHORT,
  MOD_REPORTS: CacheTTL.SHORT,
  MODERATION_QUEUE: CacheTTL.SHORT,
  MODERATION_RULE: CacheTTL.MEDIUM,
  MODERATION_LOG: CacheTTL.MEDIUM,
  
  // Admin Dashboard
  ADMIN_DASHBOARD: CacheTTL.SHORT,
  ADMIN_ANALYTICS: CacheTTL.MEDIUM,
  ADMIN_TRENDING: 1800,
  ADMIN_CONTENT_STATS: CacheTTL.MEDIUM,
  
  // Default
  DEFAULT: CacheTTL.MEDIUM
};