// src/modules/admin/services/content-management.service.ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Review } from '../../reviews/entities/review.entity';
import { List } from '../../lists/entities/list.entity';
import { Movie } from '../../movies/entities/movie.entity';
import { WatchHistory } from '../../watch-history/entities/watch-history.entity';
import { ReviewStatus } from '../../../common/enums';
import { MoviesService } from '../../movies/movies.service';

@Injectable()
export class ContentManagementService {
  private readonly logger = new Logger(ContentManagementService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(Movie)
    private movieRepository: Repository<Movie>,
    @InjectRepository(List)
    private listRepository: Repository<List>,
    @InjectRepository(WatchHistory)
    private watchHistoryRepository: Repository<WatchHistory>,
    private moviesService: MoviesService,
  ) {}

  /**
   * Get flagged reviews that need moderation
   */
  async getFlaggedReviews(page: number = 1, limit: number = 10): Promise<Review[]> {
    try {
      return this.reviewRepository.find({
        where: { isFlagged: true },
        relations: ['user', 'movie'],
        skip: (page - 1) * limit,
        take: limit,
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error(`Error getting flagged reviews: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get reviews pending approval
   */
  async getPendingReviews(page: number = 1, limit: number = 10): Promise<Review[]> {
    try {
      return this.reviewRepository.find({
        where: { status: ReviewStatus.PENDING },
        relations: ['user', 'movie'],
        skip: (page - 1) * limit,
        take: limit,
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error(`Error getting pending reviews: ${error.message}`);
      throw error;
    }
  }

  /**
   * Bulk approve reviews
   */
  async bulkApproveReviews(reviewIds: string[]): Promise<{ successCount: number; failureCount: number; errors: string[] }> {
    const result = {
      successCount: 0,
      failureCount: 0,
      errors: [] as string[],
    };

    try {
      // Get all reviews that exist
      const reviews = await this.reviewRepository.find({
        where: { 
          id: In(reviewIds),
          status: ReviewStatus.PENDING
        },
      });
      
      if (reviews.length === 0) {
        result.failureCount = reviewIds.length;
        result.errors.push('No valid pending reviews found with the provided IDs');
        return result;
      }

      // Update all reviews at once
      const updateResult = await this.reviewRepository.update(
        { id: In(reviews.map(r => r.id)) },
        { 
          status: ReviewStatus.APPROVED,
          isFlagged: false,
          moderatedAt: new Date()
        }
      );

      result.successCount = updateResult.affected || 0;
      result.failureCount = reviewIds.length - result.successCount;

      if (result.failureCount > 0) {
        result.errors.push(`Failed to update ${result.failureCount} reviews`);
      }

      return result;
    } catch (error) {
      this.logger.error(`Error bulk approving reviews: ${error.message}`);
      result.failureCount = reviewIds.length - result.successCount;
      result.errors.push(`Error: ${error.message}`);
      return result;
    }
  }

  /**
   * Bulk reject reviews
   */
  async bulkRejectReviews(reviewIds: string[], reason?: string): Promise<{ successCount: number; failureCount: number; errors: string[] }> {
    const result = {
      successCount: 0,
      failureCount: 0,
      errors: [] as string[],
    };

    try {
      // Get all reviews that exist
      const reviews = await this.reviewRepository.find({
        where: { id: In(reviewIds) },
      });
      
      if (reviews.length === 0) {
        result.failureCount = reviewIds.length;
        result.errors.push('No reviews found with the provided IDs');
        return result;
      }

      // Update all reviews at once
      const updateResult = await this.reviewRepository.update(
        { id: In(reviews.map(r => r.id)) },
        { 
          status: ReviewStatus.REJECTED,
          moderationReason: reason,
          moderatedAt: new Date()
        }
      );

      result.successCount = updateResult.affected || 0;
      result.failureCount = reviewIds.length - result.successCount;

      if (result.failureCount > 0) {
        result.errors.push(`Failed to update ${result.failureCount} reviews`);
      }

      return result;
    } catch (error) {
      this.logger.error(`Error bulk rejecting reviews: ${error.message}`);
      result.failureCount = reviewIds.length - result.successCount;
      result.errors.push(`Error: ${error.message}`);
      return result;
    }
  }

  /**
   * Bulk delete reviews
   */
  async bulkDeleteReviews(reviewIds: string[]): Promise<{ successCount: number; failureCount: number; errors: string[] }> {
    const result = {
      successCount: 0,
      failureCount: 0,
      errors: [] as string[],
    };

    try {
      // Get all reviews that exist
      const reviews = await this.reviewRepository.find({
        where: { id: In(reviewIds) },
      });
      
      if (reviews.length === 0) {
        result.failureCount = reviewIds.length;
        result.errors.push('No reviews found with the provided IDs');
        return result;
      }

      // Delete all reviews at once
      const deleteResult = await this.reviewRepository.delete(
        { id: In(reviews.map(r => r.id)) }
      );

      result.successCount = deleteResult.affected || 0;
      result.failureCount = reviewIds.length - result.successCount;

      if (result.failureCount > 0) {
        result.errors.push(`Failed to delete ${result.failureCount} reviews`);
      }

      return result;
    } catch (error) {
      this.logger.error(`Error bulk deleting reviews: ${error.message}`);
      result.failureCount = reviewIds.length - result.successCount;
      result.errors.push(`Error: ${error.message}`);
      return result;
    }
  }

  /**
   * Bulk delete lists
   */
  async bulkDeleteLists(listIds: string[]): Promise<{ successCount: number; failureCount: number; errors: string[] }> {
    const result = {
      successCount: 0,
      failureCount: 0,
      errors: [] as string[],
    };

    try {
      // Get all lists that exist
      const lists = await this.listRepository.find({
        where: { id: In(listIds) },
      });
      
      if (lists.length === 0) {
        result.failureCount = listIds.length;
        result.errors.push('No lists found with the provided IDs');
        return result;
      }

      // Delete all lists at once
      const deleteResult = await this.listRepository.delete(
        { id: In(lists.map(l => l.id)) }
      );

      result.successCount = deleteResult.affected || 0;
      result.failureCount = listIds.length - result.successCount;

      if (result.failureCount > 0) {
        result.errors.push(`Failed to delete ${result.failureCount} lists`);
      }

      return result;
    } catch (error) {
      this.logger.error(`Error bulk deleting lists: ${error.message}`);
      result.failureCount = listIds.length - result.successCount;
      result.errors.push(`Error: ${error.message}`);
      return result;
    }
  }

  /**
   * Set a list as featured or not
   */
  async setListFeatured(listId: string, featured: boolean): Promise<boolean> {
    try {
      const list = await this.listRepository.findOne({
        where: { id: listId },
      });

      if (!list) {
        throw new NotFoundException(`List with ID ${listId} not found`);
      }

      // Update the featured flag
      list.isFeatured = featured;
      await this.listRepository.save(list);
      
      return true;
    } catch (error) {
      this.logger.error(`Error setting list ${listId} featured status: ${error.message}`);
      if (error instanceof NotFoundException) {
        throw error;
      }
      return false;
    }
  }

  /**
   * Bulk set lists as featured or not
   */
  async bulkSetListFeatured(listIds: string[], featured: boolean): Promise<{ successCount: number; failureCount: number; errors: string[] }> {
    const result = {
      successCount: 0,
      failureCount: 0,
      errors: [] as string[],
    };

    try {
      // Get all lists that exist
      const lists = await this.listRepository.find({
        where: { id: In(listIds) },
      });
      
      if (lists.length === 0) {
        result.failureCount = listIds.length;
        result.errors.push('No lists found with the provided IDs');
        return result;
      }

      // Update all lists at once
      const updateResult = await this.listRepository.update(
        { id: In(lists.map(l => l.id)) },
        { isFeatured: featured }
      );

      result.successCount = updateResult.affected || 0;
      result.failureCount = listIds.length - result.successCount;

      if (result.failureCount > 0) {
        result.errors.push(`Failed to update ${result.failureCount} lists`);
      }

      return result;
    } catch (error) {
      this.logger.error(`Error bulk setting lists as featured: ${error.message}`);
      result.failureCount = listIds.length - result.successCount;
      result.errors.push(`Error: ${error.message}`);
      return result;
    }
  }

  /**
   * Get popular movies
   */
  async getPopularMovies(page: number = 1, limit: number = 10): Promise<Movie[]> {
    try {
      return this.movieRepository.find({
        where: { isPopular: true },
        skip: (page - 1) * limit,
        take: limit,
        order: { voteAverage: 'DESC' },
      });
    } catch (error) {
      this.logger.error(`Error getting popular movies: ${error.message}`);
      throw error;
    }
  }

  /**
   * Set a movie as popular or not
   */
  async setMoviePopular(movieId: string, isPopular: boolean): Promise<boolean> {
    try {
      const movie = await this.movieRepository.findOne({
        where: { id: movieId },
      });

      if (!movie) {
        throw new NotFoundException(`Movie with ID ${movieId} not found`);
      }

      // Update the popular flag
      movie.isPopular = isPopular;
      await this.movieRepository.save(movie);
      
      return true;
    } catch (error) {
      this.logger.error(`Error setting movie ${movieId} popular status: ${error.message}`);
      if (error instanceof NotFoundException) {
        throw error;
      }
      return false;
    }
  }

  /**
   * Bulk set movies as popular or not
   */
  async bulkSetMoviesPopular(movieIds: string[], isPopular: boolean): Promise<{ successCount: number; failureCount: number; errors: string[] }> {
    const result = {
      successCount: 0,
      failureCount: 0,
      errors: [] as string[],
    };

    try {
      // Get all movies that exist
      const movies = await this.movieRepository.find({
        where: { id: In(movieIds) },
      });
      
      if (movies.length === 0) {
        result.failureCount = movieIds.length;
        result.errors.push('No movies found with the provided IDs');
        return result;
      }

      // Update all movies at once
      const updateResult = await this.movieRepository.update(
        { id: In(movies.map(m => m.id)) },
        { isPopular }
      );

      result.successCount = updateResult.affected || 0;
      result.failureCount = movieIds.length - result.successCount;

      if (result.failureCount > 0) {
        result.errors.push(`Failed to update ${result.failureCount} movies`);
      }

      return result;
    } catch (error) {
      this.logger.error(`Error bulk setting movies as popular: ${error.message}`);
      result.failureCount = movieIds.length - result.successCount;
      result.errors.push(`Error: ${error.message}`);
      return result;
    }
  }

  /**
   * Refresh a movie's metadata from TMDB
   */
  async refreshMovieMetadata(movieId: string): Promise<boolean> {
    try {
      const movie = await this.movieRepository.findOne({
        where: { id: movieId },
      });

      if (!movie) {
        throw new NotFoundException(`Movie with ID ${movieId} not found`);
      }

      // Get fresh data from TMDB
      const refreshedMovie = await this.moviesService.refreshMovieFromTMDB(movie.tmdbId);
      
      return !!refreshedMovie;
    } catch (error) {
      this.logger.error(`Error refreshing movie metadata for ${movieId}: ${error.message}`);
      if (error instanceof NotFoundException) {
        throw error;
      }
      return false;
    }
  }

  /**
   * Bulk refresh movies' metadata from TMDB
   */
  async bulkRefreshMoviesMetadata(movieIds: string[]): Promise<{ successCount: number; failureCount: number; errors: string[] }> {
    const result = {
      successCount: 0,
      failureCount: 0,
      errors: [] as string[],
    };

    try {
      // Get all movies that exist
      const movies = await this.movieRepository.find({
        where: { id: In(movieIds) },
      });
      
      if (movies.length === 0) {
        result.failureCount = movieIds.length;
        result.errors.push('No movies found with the provided IDs');
        return result;
      }

      // Process each movie individually since we need to make API calls
      for (const movie of movies) {
        try {
          await this.moviesService.refreshMovieFromTMDB(movie.tmdbId);
          result.successCount++;
        } catch (error) {
          result.failureCount++;
          result.errors.push(`Failed to refresh ${movie.title}: ${error.message}`);
        }
      }

      return result;
    } catch (error) {
      this.logger.error(`Error bulk refreshing movies metadata: ${error.message}`);
      result.failureCount = movieIds.length - result.successCount;
      result.errors.push(`Error: ${error.message}`);
      return result;
    }
  }
}