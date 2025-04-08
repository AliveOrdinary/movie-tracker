// src/modules/reviews/reviews-tmdb.service.ts
import { Injectable, NotFoundException, Inject, forwardRef, Logger } from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { Review } from './entities/review.entity';
import { CreateReviewInput } from './dto/create-review.input';
import { ReviewsService } from './reviews.service';
import { MoviesService } from '../movies/movies.service';

/**
 * Service to handle review operations with TMDB ID input
 * Acts as an adapter between the TMDB ID based inputs and the UUID based storage
 */
@Injectable()
export class ReviewsTmdbService {
  private readonly logger = new Logger(ReviewsTmdbService.name);

  constructor(
    private readonly reviewsService: ReviewsService,
    @Inject(forwardRef(() => MoviesService))
    private readonly moviesService: MoviesService,
  ) {}

  /**
   * Create a new review using TMDB ID as input
   * @param input The review input containing tmdbId
   * @param user The user creating the review
   */
  async createReview(input: CreateReviewInput, user: User): Promise<Review> {
    try {
      // Find or create the movie from TMDB ID
      const tmdbId = input.tmdbId;
      let movie = await this.moviesService.findByTmdbId(tmdbId);
      
      if (!movie) {
        try {
          // Fetch and create movie if it doesn't exist
          const tmdbMovie = await this.moviesService.tmdbService.getMovie(tmdbId);
          movie = await this.moviesService.createOrUpdateFromTMDB(tmdbMovie);
        } catch (error) {
          this.logger.error(`Failed to fetch movie with TMDB ID ${tmdbId}:`, error);
          throw new NotFoundException(`Movie with TMDB ID ${tmdbId} not found`);
        }
      }
      
      // Use internal movie UUID for database relationship
      return this.reviewsService.create({
        content: input.content,
        rating: input.rating,
        containsSpoilers: input.containsSpoilers,
        tags: input.tags,
        watchHistory: input.watchHistoryId ? { id: input.watchHistoryId } : undefined,
        movie, // UUID-based relationship
        user
      });
    } catch (error) {
      this.logger.error(`Error creating review with TMDB ID: ${error.message}`, error.stack);
      throw error;
    }
  }
}
