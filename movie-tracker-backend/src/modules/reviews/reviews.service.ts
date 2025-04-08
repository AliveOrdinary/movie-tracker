// src/modules/reviews/reviews.service.ts
import { Injectable, ConflictException, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { Repository, FindManyOptions, FindOptionsWhere, DeepPartial, MoreThanOrEqual, Between, LessThanOrEqual } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';

import { BaseService } from '../../common/services/base.service';
import { CacheService } from '../../common/services/cache.service';
import { CacheKeyFactory } from '../../common/factories/cache-key.factory';
import { Review } from './entities/review.entity';
import { ReviewReaction } from './entities/review-reaction.entity';
import { User } from '../users/entities/user.entity';
import { Movie } from '../movies/entities/movie.entity';

import { CreateReviewInput } from './dto/create-review.input';
import { UpdateReviewInput } from './dto/update-review.input';
import { ReviewFilters, UserReviewFilters, MovieReviewFilters } from './types/review-filters.type';
import { ReviewStats } from './types/review-stats.type';
import { ReviewEventType } from './events/review.events';
import { ReactionType } from '../../common/enums';
import { ReviewStatus } from '../../common/enums';
import { CACHE_KEYS } from './constants/cache-keys.constant';
import { CacheTTL, EntityCacheTTL } from '../../common/constants/cache-ttl.constants';

@Injectable()
export class ReviewsService extends BaseService<Review> {
  protected readonly logger = new Logger(ReviewsService.name);

  constructor(
    @InjectRepository(Review)
    protected readonly reviewRepository: Repository<Review>,
    @InjectRepository(ReviewReaction)
    private readonly reactionRepository: Repository<ReviewReaction>,
    protected readonly cacheService: CacheService,
    protected readonly cacheKeyFactory: CacheKeyFactory,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super(reviewRepository, cacheService, 'review', cacheKeyFactory);
  }

  /**
   * Create a new review using TMDB ID
   * @param input The review input containing tmdbId instead of movieId
   * @param user The user creating the review
   * @param moviesService Reference to MoviesService for TMDB ID resolution
   */
  async createWithTmdbId(input: CreateReviewInput, user: User, moviesService: any): Promise<Review> {
    try {
      // Find the movie by TMDB ID or create it if it doesn't exist
      const tmdbId = input.tmdbId;
      let movie = await moviesService.findByTmdbId(tmdbId);
      
      if (!movie) {
        try {
          // If the movie doesn't exist, fetch it from TMDB and create it
          const tmdbMovie = await moviesService.tmdbService.getMovie(tmdbId);
          movie = await moviesService.createOrUpdateFromTMDB(tmdbMovie);
        } catch (error) {
          this.logger.error(`Failed to fetch movie with TMDB ID ${tmdbId}:`, error);
          throw new NotFoundException(`Movie with TMDB ID ${tmdbId} not found`);
        }
      }
      
      // Now we have the Movie entity with internal UUID
      // Use that for creating the review instead of the TMDB ID
      return this.create({
        ...input,
        movie,
        user
      });
    } catch (error) {
      this.logger.error(`Error creating review with TMDB ID: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update an existing review
   */
  async update(id: string, data: DeepPartial<Review>): Promise<Review> {
    try {
      const review = await this.reviewRepository.findOne({
        where: { id },
        relations: ['user', 'movie']
      });

      if (!review) {
        throw new NotFoundException('Review not found');
      }

      // Check if the user owns this review
      if (data.user && (data.user as User).id !== review.user.id) {
        throw new ForbiddenException('You can only update your own reviews');
      }

      Object.assign(review, data);
      const updatedReview = await this.reviewRepository.save(review);

      // Clear caches
      await this.invalidateReviewCaches(updatedReview);

      // Emit event
      this.eventEmitter.emit(ReviewEventType.REVIEW_UPDATED, {
        review: updatedReview,
        user: review.user,
        timestamp: new Date()
      });

      return updatedReview;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error(`Error updating review ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Delete a review
   */
  async remove(id: string, user: User): Promise<boolean> {
    try {
      const review = await this.reviewRepository.findOne({
        where: { id },
        relations: ['user', 'movie']
      });

      if (!review) {
        throw new NotFoundException('Review not found');
      }

      if (review.user.id !== user.id) {
        throw new ForbiddenException('You can only delete your own reviews');
      }

      // Store movie and user IDs before removing the review
      const { movie, user: reviewUser } = review;

      await this.reviewRepository.remove(review);

      // Clear caches
      await this.invalidateReviewCaches({
        id,
        movie,
        user: reviewUser
      } as Review);

      // Emit event
      this.eventEmitter.emit(ReviewEventType.REVIEW_DELETED, {
        review,
        user,
        timestamp: new Date()
      });

      return true;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error(`Error removing review ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find reviews for a specific movie with filtering and pagination
   */
  async findByMovie(movieId: string, filters: MovieReviewFilters = {}): Promise<[Review[], number]> {
    try {
      const { 
        page = 1, 
        limit = 10, 
        sortBy = 'createdAt', 
        minRating, 
        maxRating,
        onlyVerifiedWatches = false
      } = filters;

      // Generate cache key based on all parameters
      const cacheKey = this.cacheKeyFactory.review.movieReviews(movieId);
      const filterHash = JSON.stringify({ page, limit, sortBy, minRating, maxRating, onlyVerifiedWatches });

      return this.cacheService.getOrFetch(
        `${cacheKey}:${filterHash}`,
        async () => {
          const where: FindOptionsWhere<Review> = { 
            movie: { id: movieId },
            status: ReviewStatus.APPROVED
          };

          if (minRating) {
            where.rating = MoreThanOrEqual(minRating);
          }

          if (maxRating) {
            where.rating = minRating ? Between(minRating, maxRating) : LessThanOrEqual(maxRating);
          }

          const options: FindManyOptions<Review> = {
            where,
            relations: ['user', 'reactions'],
            order: { 
              [sortBy]: 'DESC',
              createdAt: 'DESC'
            },
            skip: (page - 1) * limit,
            take: limit
          };

          return this.reviewRepository.findAndCount(options);
        },
        EntityCacheTTL.REVIEW_DETAILS
      );
    } catch (error) {
      this.logger.error(`Error finding reviews for movie ${movieId}: ${error.message}`, error.stack);
      
      // Fallback to direct query if cache fails
      const where: FindOptionsWhere<Review> = { 
        movie: { id: movieId },
        status: ReviewStatus.APPROVED
      };

      if (filters.minRating) {
        where.rating = MoreThanOrEqual(filters.minRating);
      }

      if (filters.maxRating) {
        where.rating = filters.minRating ? Between(filters.minRating, filters.maxRating) : LessThanOrEqual(filters.maxRating);
      }

      return this.reviewRepository.findAndCount({
        where,
        relations: ['user', 'reactions'],
        order: { 
          [filters.sortBy || 'createdAt']: 'DESC',
          createdAt: 'DESC'
        },
        skip: ((filters.page || 1) - 1) * (filters.limit || 10),
        take: filters.limit || 10
      });
    }
  }

  /**
   * Find reviews by a specific user with filtering and pagination
   */
  async findByUser(userId: string, filters: UserReviewFilters = {}): Promise<[Review[], number]> {
    try {
      const { 
        page = 1, 
        limit = 10, 
        sortBy = 'createdAt', 
        minRating, 
        maxRating,
        includePrivate = false
      } = filters;

      // Generate cache key based on all parameters
      const cacheKey = this.cacheKeyFactory.review.userReviews(userId);
      const filterHash = JSON.stringify({ page, limit, sortBy, minRating, maxRating, includePrivate });

      return this.cacheService.getOrFetch(
        `${cacheKey}:${filterHash}`,
        async () => {
          const where: FindOptionsWhere<Review> = { 
            user: { id: userId },
            status: ReviewStatus.APPROVED
          };

          if (minRating) {
            where.rating = MoreThanOrEqual(minRating);
          }

          if (maxRating) {
            where.rating = minRating ? Between(minRating, maxRating) : LessThanOrEqual(maxRating);
          }

          const options: FindManyOptions<Review> = {
            where,
            relations: ['movie', 'reactions'],
            order: { 
              [sortBy]: 'DESC',
              createdAt: 'DESC'
            },
            skip: (page - 1) * limit,
            take: limit
          };

          return this.reviewRepository.findAndCount(options);
        },
        EntityCacheTTL.USER_REVIEW
      );
    } catch (error) {
      this.logger.error(`Error finding reviews for user ${userId}: ${error.message}`, error.stack);
      
      // Fallback to direct query if cache fails
      const where: FindOptionsWhere<Review> = { 
        user: { id: userId },
        status: ReviewStatus.APPROVED
      };

      if (filters.minRating) {
        where.rating = MoreThanOrEqual(filters.minRating);
      }

      if (filters.maxRating) {
        where.rating = filters.minRating ? Between(filters.minRating, filters.maxRating) : LessThanOrEqual(filters.maxRating);
      }

      return this.reviewRepository.findAndCount({
        where,
        relations: ['movie', 'reactions'],
        order: { 
          [filters.sortBy || 'createdAt']: 'DESC',
          createdAt: 'DESC'
        },
        skip: ((filters.page || 1) - 1) * (filters.limit || 10),
        take: filters.limit || 10
      });
    }
  }

  /**
   * Add a reaction to a review
   */
  async addReaction(input: { reviewId: string; type: ReactionType }, user: User): Promise<Review> {
    try {
      const review = await this.reviewRepository.findOne({
        where: { id: input.reviewId },
        relations: ['reactions', 'user', 'movie']
      });

      if (!review) {
        throw new NotFoundException('Review not found');
      }

      // Check if user has already reacted with this type
      const existingReaction = review.reactions.find(
        r => r.user.id === user.id && r.type === input.type
      );

      if (existingReaction) {
        throw new ConflictException('You have already reacted with this type');
      }

      const reaction = this.reactionRepository.create({
        review,
        user,
        type: input.type
      });

      await this.reactionRepository.save(reaction);

      // Update reaction count
      review.reactionCount = review.reactions.length + 1;
      await this.reviewRepository.save(review);

      // Clear caches
      await this.invalidateReactionCaches(review.id, user.id);

      // Emit event
      this.eventEmitter.emit(ReviewEventType.REACTION_ADDED, {
        review,
        user,
        reactionType: input.type,
        timestamp: new Date()
      });

      return review;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Error adding reaction to review ${input.reviewId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Remove a reaction from a review
   */
  async removeReaction(reviewId: string, type: ReactionType, user: User): Promise<Review> {
    try {
      const review = await this.reviewRepository.findOne({
        where: { id: reviewId },
        relations: ['reactions', 'user', 'movie']
      });

      if (!review) {
        throw new NotFoundException('Review not found');
      }

      const reaction = review.reactions.find(
        r => r.user.id === user.id && r.type === type
      );

      if (!reaction) {
        throw new NotFoundException('Reaction not found');
      }

      await this.reactionRepository.remove(reaction);

      // Update reaction count
      review.reactionCount = review.reactions.length - 1;
      await this.reviewRepository.save(review);

      // Clear caches
      await this.invalidateReactionCaches(reviewId, user.id);

      // Emit event
      this.eventEmitter.emit(ReviewEventType.REACTION_REMOVED, {
        review,
        user,
        reactionType: type,
        timestamp: new Date()
      });

      return review;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error removing reaction from review ${reviewId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get reaction statistics for a review
   */
  async getReactionStats(reviewId: string): Promise<Map<ReactionType, number>> {
    try {
      const cacheKey = this.cacheKeyFactory.review.reactions(reviewId);
      
      return this.cacheService.getOrFetch(
        cacheKey,
        async () => {
          const reactions = await this.reactionRepository.find({
            where: { review: { id: reviewId } }
          });

          const stats = new Map<ReactionType, number>();
          for (const reaction of reactions) {
            const currentCount = stats.get(reaction.type) || 0;
            stats.set(reaction.type, currentCount + 1);
          }

          return stats;
        },
        EntityCacheTTL.REVIEW_STATS
      );
    } catch (error) {
      this.logger.error(`Error getting reaction stats for review ${reviewId}: ${error.message}`, error.stack);
      
      // Fallback to direct query
      const reactions = await this.reactionRepository.find({
        where: { review: { id: reviewId } }
      });

      const stats = new Map<ReactionType, number>();
      for (const reaction of reactions) {
        const currentCount = stats.get(reaction.type) || 0;
        stats.set(reaction.type, currentCount + 1);
      }

      return stats;
    }
  }

  /**
   * Get a user's reaction to a specific review
   */
  async getUserReaction(reviewId: string, userId: string): Promise<ReactionType | null> {
    try {
      const cacheKey = this.cacheKeyFactory.generate('review', 'userReaction', [reviewId, userId]);
      
      return this.cacheService.getOrFetch(
        cacheKey,
        async () => {
          const reaction = await this.reactionRepository.findOne({
            where: { 
              review: { id: reviewId },
              user: { id: userId }
            }
          });

          return reaction ? reaction.type : null;
        },
        EntityCacheTTL.REVIEW_STATS
      );
    } catch (error) {
      this.logger.error(`Error getting user reaction for review ${reviewId}: ${error.message}`, error.stack);
      
      // Fallback to direct query
      try {
        const reaction = await this.reactionRepository.findOne({
          where: { 
            review: { id: reviewId },
            user: { id: userId }
          }
        });

        return reaction ? reaction.type : null;
      } catch (innerError) {
        this.logger.error(`Error in fallback get user reaction: ${innerError.message}`);
        return null;
      }
    }
  }

  /**
   * Get review statistics for a movie
   */
  async getMovieReviewStats(movieId: string): Promise<ReviewStats> {
    try {
      const cacheKey = this.cacheKeyFactory.review.movieStats(movieId);
      
      return this.cacheService.getOrFetch(
        cacheKey,
        async () => {
          const [reviews, totalReviews] = await this.findByMovie(movieId);

          if (totalReviews === 0) {
            return {
              totalReviews: 0,
              averageRating: 0,
              totalReactions: 0,
              recentReviews: 0,
              positivePercentage: 0
            };
          }

          const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
          const totalReactions = reviews.reduce((sum, review) => sum + review.reactionCount, 0);
          const positivePercentage = (reviews.filter(r => r.rating >= 7).length / totalReviews) * 100;
          
          // Calculate reviews from the last 30 days
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          
          const recentReviews = reviews.filter(r => 
            new Date(r.createdAt) > thirtyDaysAgo
          ).length;

          const stats: ReviewStats = {
            totalReviews,
            averageRating,
            totalReactions,
            recentReviews,
            positivePercentage
          };

          return stats;
        },
        EntityCacheTTL.MOVIE_REVIEW_STATS
      );
    } catch (error) {
      this.logger.error(`Error getting movie review stats for movie ${movieId}: ${error.message}`, error.stack);
      
      // Return default stats on error
      return {
        totalReviews: 0,
        averageRating: 0,
        totalReactions: 0,
        recentReviews: 0,
        positivePercentage: 0
      };
    }
  }

  /**
   * Get review statistics for a user
   */
  async getUserReviewStats(userId: string): Promise<ReviewStats> {
    try {
      const cacheKey = this.cacheKeyFactory.review.userStats(userId);
      
      return this.cacheService.getOrFetch(
        cacheKey,
        async () => {
          const [reviews, totalReviews] = await this.findByUser(userId);

          if (totalReviews === 0) {
            return {
              totalReviews: 0,
              averageRating: 0,
              totalReactions: 0,
              recentReviews: 0,
              positivePercentage: 0
            };
          }

          const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
          const totalReactions = reviews.reduce((sum, review) => sum + review.reactionCount, 0);
          const positivePercentage = (reviews.filter(r => r.rating >= 7).length / totalReviews) * 100;
          
          // Calculate reviews from the last 30 days
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          
          const recentReviews = reviews.filter(r => 
            new Date(r.createdAt) > thirtyDaysAgo
          ).length;

          const stats: ReviewStats = {
            totalReviews,
            averageRating,
            totalReactions,
            recentReviews,
            positivePercentage
          };

          return stats;
        },
        EntityCacheTTL.REVIEW_STATS
      );
    } catch (error) {
      this.logger.error(`Error getting user review stats for user ${userId}: ${error.message}`, error.stack);
      
      // Return default stats on error
      return {
        totalReviews: 0,
        averageRating: 0,
        totalReactions: 0,
        recentReviews: 0,
        positivePercentage: 0
      };
    }
  }

  /**
   * Find a review by user and movie IDs
   */
  async findByUserAndMovie(userId: string, movieId: string): Promise<Review | null> {
    try {
      const cacheKey = this.cacheKeyFactory.review.userMovie(userId, movieId);
      
      return this.cacheService.getOrFetch(
        cacheKey,
        async () => {
          const review = await this.reviewRepository.findOne({
            where: {
              user: { id: userId },
              movie: { id: movieId }
            },
            relations: ['reactions']
          });

          return review;
        },
        EntityCacheTTL.USER_REVIEW
      );
    } catch (error) {
      this.logger.error(`Error finding review for user ${userId} and movie ${movieId}: ${error.message}`, error.stack);
      
      // Return null on error
      return null;
    }
  }

  /**
   * Invalidate all caches related to a review
   */
  private async invalidateReviewCaches(review: Review): Promise<void> {
    try {
      const cachesToInvalidate = [
        // Review details
        this.cacheKeyFactory.review.details(review.id),
        
        // Collections that include this review
        this.cacheKeyFactory.review.movieReviews(review.movie.id),
        this.cacheKeyFactory.review.userReviews(review.user.id),
        
        // Review stats
        this.cacheKeyFactory.review.movieStats(review.movie.id),
        this.cacheKeyFactory.review.userStats(review.user.id),
        
        // User-movie specific review
        this.cacheKeyFactory.review.userMovie(review.user.id, review.movie.id)
      ];

      // Also invalidate any pattern-based pagination keys
      const patternCachesToInvalidate = [
        `review:movie:${review.movie.id}:*`, 
        `review:user:${review.user.id}:*`
      ];

      // Execute invalidations
      await Promise.all([
        // Specific cache keys
        this.cacheService.invalidateMultiple(cachesToInvalidate),
        
        // Pattern-based invalidations
        ...patternCachesToInvalidate.map(pattern => 
          this.cacheService.invalidatePattern(pattern)
        )
      ]);

      this.logger.debug(`Invalidated caches for review ${review.id}`);
    } catch (error) {
      this.logger.error(`Error invalidating review caches: ${error.message}`, error.stack);
      // Don't rethrow as this is a background operation
    }
  }

  /**
   * Invalidate all caches related to reactions
   */
  private async invalidateReactionCaches(reviewId: string, userId: string): Promise<void> {
    try {
      const cachesToInvalidate = [
        // Reaction stats
        this.cacheKeyFactory.review.reactions(reviewId),
        
        // User-specific reaction
        this.cacheKeyFactory.generate('review', 'userReaction', [reviewId, userId]),
        
        // Review details (since reactions are part of it)
        this.cacheKeyFactory.review.details(reviewId)
      ];

      await this.cacheService.invalidateMultiple(cachesToInvalidate);
      this.logger.debug(`Invalidated reaction caches for review ${reviewId}`);
    } catch (error) {
      this.logger.error(`Error invalidating reaction caches: ${error.message}`, error.stack);
      // Don't rethrow as this is a background operation
    }
  }
}