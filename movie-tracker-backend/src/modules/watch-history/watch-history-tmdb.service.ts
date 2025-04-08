// src/modules/watch-history/watch-history-tmdb.service.ts
import { Injectable, NotFoundException, Inject, forwardRef, Logger } from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { WatchHistory } from './entities/watch-history.entity';
import { CreateWatchInput } from './dto/create-watch.input';
import { WatchHistoryService } from './watch-history.service';
import { MoviesService } from '../movies/movies.service';

/**
 * Service to handle watch history operations with TMDB ID input
 * Acts as an adapter between the TMDB ID based inputs and the UUID based storage
 */
@Injectable()
export class WatchHistoryTmdbService {
  private readonly logger = new Logger(WatchHistoryTmdbService.name);

  constructor(
    private readonly watchHistoryService: WatchHistoryService,
    @Inject(forwardRef(() => MoviesService))
    private readonly moviesService: MoviesService,
  ) {}

  /**
   * Create a watch record using TMDB ID
   * @param input The watch input containing tmdbId
   * @param user The user creating the watch record
   */
  async createWatch(input: CreateWatchInput, user: User): Promise<WatchHistory> {
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
      return this.watchHistoryService.create({
        userId: user.id,
        watchedAt: input.watchedAt,
        watchType: input.watchType,
        rating: input.rating,
        notes: input.notes,
        watchDuration: input.watchDuration,
        isPrivate: input.isPrivate || false,
        isFavorite: input.isFavorite,
        contextTags: input.contextTags,
        moodRating: input.moodRating,
        tmdbId: input.tmdbId, // Include the tmdbId from input
        // Pass the movie entity which will be used for the movie relation
        movieEntity: movie
      });
    } catch (error) {
      this.logger.error(`Error creating watch with TMDB ID: ${error.message}`, error.stack);
      throw error;
    }
  }
}
