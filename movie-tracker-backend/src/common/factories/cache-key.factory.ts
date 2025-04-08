// src/common/factories/cache-key.factory.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Factory service for generating consistent cache keys across the application
 */
@Injectable()
export class CacheKeyFactory {
  private readonly prefix: string;

  constructor(private configService: ConfigService) {
    this.prefix = this.configService.get('CACHE_PREFIX', 'app');
  }

  /**
   * Generate a namespaced cache key
   * @param domain The domain/module of the key (e.g., 'auth', 'movie', 'user')
   * @param action The action/operation (e.g., 'profile', 'details', 'list')
   * @param identifiers Additional identifiers (e.g., user ID, movie ID, page number)
   * @returns Formatted cache key
   */
  generate(domain: string, action: string, identifiers: (string | number)[] = []): string {
    const keyParts = [this.prefix, domain, action];
    
    if (identifiers.length > 0) {
      keyParts.push(...identifiers.map(id => id.toString()));
    }
    
    return keyParts.join(':');
  }

  /**
   * Generate a key for authentication-related caching
   */
  auth = {
    token: (token: string) => this.generate('auth', 'token', [token]),
    user: (userId: string) => this.generate('auth', 'user', [userId]),
    refreshToken: (userId: string) => this.generate('auth', 'refresh', [userId]),
    blacklist: (token: string) => this.generate('auth', 'blacklist', [token]),
  };

  /**
   * Generate a key for user-related caching
   */
  user = {
    profile: (userId: string) => this.generate('user', 'profile', [userId]),
    stats: (userId: string) => this.generate('user', 'stats', [userId]),
    activity: (userId: string) => this.generate('user', 'activity', [userId]),
    watchHistory: (userId: string) => this.generate('user', 'watch-history', [userId]),
    reviewStats: (userId: string) => this.generate('user', 'review-stats', [userId]),
    favoritedLists: (userId: string, page = 1, limit = 10) => 
      this.generate('user', 'favorites', [userId, page.toString(), limit.toString()]),
    collaborativeLists: (userId: string) => this.generate('user', 'collaborations', [userId]),
    collaborativeListIds: (userId: string) => this.generate('user', 'collaborative-list-ids', [userId]),
    permissions: (userId: string, entityType: string, entityId: string) => 
      this.generate('user', 'permissions', [userId, entityType, entityId]),
    reputation: (userId: string) => this.generate('user', 'reputation', [userId]),
    reputationLevel: (level: string) => this.generate('user', 'reputationLevel', [level]),
  };

  /**
   * Generate a key for movie-related caching
   */
  movie = {
    entity: (movieId: string) => this.generate('movie', 'entity', [movieId]),
    details: (tmdbId: number) => this.generate('movie', 'details', [tmdbId]),
    byTmdbId: (tmdbId: number) => this.generate('movie', 'tmdbId', [tmdbId]),
    popular: (page: number) => this.generate('movie', 'popular', [page]),
    trending: (timeWindow: string) => this.generate('movie', 'trending', [timeWindow]),
    search: (query: string, page = 1) => this.generate('movie', 'search', [query.toLowerCase(), page]),
    credits: (tmdbId: number) => this.generate('movie', 'credits', [tmdbId]),
    videos: (tmdbId: number) => this.generate('movie', 'videos', [tmdbId]),
    upcoming: (page: number) => this.generate('movie', 'upcoming', [page]),
    topRated: (page: number) => this.generate('movie', 'top-rated', [page]),
    nowPlaying: (page: number) => this.generate('movie', 'now-playing', [page]),
    byGenre: (genreId: number, page: number) => this.generate('movie', 'genre', [genreId, page]),
    similar: (tmdbId: number, page: number) => this.generate('movie', 'similar', [tmdbId, page]),
    recommendations: (tmdbId: number, page: number) => this.generate('movie', 'recommendations', [tmdbId, page]),
    watchProviders: (tmdbId: number) => this.generate('movie', 'providers', [tmdbId]),
    genres: () => this.generate('movie', 'genres'),
  };

  /**
   * Generate a key for review-related caching
   */
  review = {
    allReviews: () => this.generate('review', 'all'),
    movieReviews: (movieId: string) => this.generate('review', 'movie', [movieId]),
    userReviews: (userId: string) => this.generate('review', 'user', [userId]),
    stats: (reviewId: string) => this.generate('review', 'stats', [reviewId]),
    movieStats: (movieId: string) => this.generate('review', 'movie-stats', [movieId]),
    userStats: (userId: string) => this.generate('review', 'user-stats', [userId]),
    details: (reviewId: string) => this.generate('review', 'details', [reviewId]),
    reactions: (reviewId: string) => this.generate('review', 'reactions', [reviewId]),
    userMovie: (userId: string, movieId: string) => this.generate('review', 'user-movie', [userId, movieId]),
  };

  /**
   * Generate a key for list-related caching
   */
  list = {
    // List entity
    details: (listId: string) => this.generate('list', 'details', [listId]),
    items: (listId: string) => this.generate('list', 'items', [listId]),
    itemCount: (listId: string) => this.generate('list', 'itemCount', [listId]),
    stats: (listId: string) => this.generate('list', 'stats', [listId]),
    collaborators: (listId: string) => this.generate('list', 'collaborators', [listId]),
    
    // User's lists
    userLists: (userId: string, type?: string) => this.generate('list', 'user', [userId, type || 'all']),
    
    // Access control
    userAccess: (listId: string, userId: string) => this.generate('list', 'userAccess', [listId, userId]),
    access: (listId: string, userId: string) => this.generate('list', 'access', [listId, userId]),
    isCollaborator: (listId: string, userId: string) => this.generate('list', 'isCollaborator', [listId, userId]),
    collaborator: (listId: string, userId: string) => this.generate('list', 'collaborator', [listId, userId]),
    favorited: (listId: string, userId: string) => this.generate('list', 'favorited', [listId, userId]),
    
    // List discovery
    popular: (page: number = 1, limit: number = 10) => this.generate('list', 'popular', [page, limit]),
    trending: (timeframe: string, page: number = 1, limit: number = 10) => 
      this.generate('list', 'trending', [timeframe, page.toString(), limit.toString()]),
    category: (category: string, page: number = 1, limit: number = 10) => 
      this.generate('list', 'category', [category, page.toString(), limit.toString()]),
    search: (hash: string) => this.generate('list', 'search', [hash]),
    
    // Misc
    favorites: (listId: string) => this.generate('list', 'favorites', [listId]),
  };

  /**
   * Generate a key for moderation-related caching
   */
  moderation = {
    // General stats and lists
    stats: () => this.generate('moderation', 'stats'),
    reportedContent: (page: number = 1, limit: number = 10) => 
      this.generate('moderation', 'reportedContent', [page, limit]),
    flaggedReviews: (page: number = 1, limit: number = 10) => 
      this.generate('moderation', 'flaggedReviews', [page, limit]),
    pendingReviews: (page: number = 1, limit: number = 10) => 
      this.generate('moderation', 'pendingReviews', [page, limit]),
    flaggedLists: (page: number = 1, limit: number = 10) => 
      this.generate('moderation', 'flaggedLists', [page, limit]),
    logs: (page: number = 1, limit: number = 10, filterHash?: string) => 
      this.generate('moderation', 'logs', [page, limit, filterHash || 'all']),
      
    // Queue related
    queueItem: (id: string) => this.generate('moderation', 'queueItem', [id]),
    queue: (filterHash: string) => this.generate('moderation', 'queue', [filterHash]),
    nextItem: (moderatorId: string) => this.generate('moderation', 'nextItem', [moderatorId]),
    queueStats: () => this.generate('moderation', 'queueStats'),
    
    // Auto-moderation related
    rules: (contentType?: string, ruleType?: string, isActive?: boolean) => 
      this.generate('moderation', 'rules', [contentType || 'all', ruleType || 'all', isActive?.toString() || 'all']),
    rule: (id: string) => this.generate('moderation', 'rule', [id]),
    
    // Content specific moderation
    reviewModeration: (reviewId: string) => this.generate('moderation', 'review', [reviewId]),
    listModeration: (listId: string) => this.generate('moderation', 'list', [listId]),
    userModeration: (userId: string) => this.generate('moderation', 'user', [userId]),
    
    // Reports
    report: (id: string) => this.generate('moderation', 'report', [id]),
    reportsByContent: (contentType: string, contentId: string) => 
      this.generate('moderation', 'contentReports', [contentType, contentId]),
    reportsByStatus: (status: string, page: number = 1, limit: number = 10) => 
      this.generate('moderation', 'statusReports', [status, page, limit]),
    reportsByReporter: (reporterId: string, page: number = 1, limit: number = 10) => 
      this.generate('moderation', 'reporterReports', [reporterId, page, limit]),
  };
  
  /**
   * Generate a key for watch-history-related caching
   */
  watchHistory = {
    user: (userId: string, page: number = 1, limit: number = 10) => 
      this.generate('watch', 'user', [userId, page.toString(), limit.toString()]),
    movie: (userId: string, movieId: string) => this.generate('watch', 'movie', [userId, movieId]),
    stats: (userId: string) => this.generate('watch', 'stats', [userId]),
    recent: (userId: string, limit: number = 5) => this.generate('watch', 'recent', [userId, limit.toString()]),
    count: (userId: string) => this.generate('watch', 'count', [userId]),
  };
  
  /**
   * Generate a key for notification-related caching
   */
  notification = {
    user: (userId: string, page: number = 1, limit: number = 10) => 
      this.generate('notification', 'user', [userId, page.toString(), limit.toString()]),
    unread: (userId: string) => this.generate('notification', 'unread', [userId]),
    count: (userId: string) => this.generate('notification', 'count', [userId]),
  };
}