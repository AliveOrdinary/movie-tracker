import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Movie } from './entities/movie.entity';
import { Review } from '../reviews/entities/review.entity';
import { TMDBService } from './services/tmdb.service';
import { TMDBResponse, TMDBMovieDetails } from './types/tmdb.types';
import { BaseService } from '../../common/services/base.service';
import { CacheService } from '../../common/services/cache.service';
import { CacheKeyFactory } from '../../common/factories/cache-key.factory';
import { EntityCacheTTL } from '../../common/constants/cache-ttl.constants';

@Injectable()
export class MoviesService extends BaseService<Movie> {
  protected readonly logger = new Logger(MoviesService.name);

  constructor(
    @InjectRepository(Movie)
    protected readonly moviesRepository: Repository<Movie>,
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    public readonly tmdbService: TMDBService,
    protected readonly cacheService: CacheService,
    protected readonly cacheKeyFactory: CacheKeyFactory,
  ) {
    super(moviesRepository, cacheService, 'movie', cacheKeyFactory);
  }
  async getNowPlayingMovies(page = 1): Promise<TMDBResponse> {
    try {
      const cacheKey = this.cacheKeyFactory.movie.nowPlaying(page);
      const response = await this.cacheService.getOrFetch<TMDBResponse>(
        cacheKey,
        () => this.tmdbService.getNowPlayingMovies(page),
        EntityCacheTTL.MOVIE_NOW_PLAYING
      );
  
      return {
        results: response.results || [],
        page: response.page || 1,
        total_pages: response.total_pages || 0,
        total_results: response.total_results || 0
      };
    } catch (error) {
      this.logger.error(`Error getting now playing movies: ${error.message}`, error.stack);
      return {
        results: [],
        page: 1,
        total_pages: 0,
        total_results: 0
      };
    }
  }
  async getPopularMovies(page = 1): Promise<TMDBResponse> {
    try {
      const cacheKey = this.cacheKeyFactory.movie.popular(page);
      const response = await this.cacheService.getOrFetch<TMDBResponse>(
        cacheKey,
        () => this.tmdbService.getPopularMovies(page),
        EntityCacheTTL.MOVIE_POPULAR
      );

      return {
        results: response.results || [],
        page: response.page || 1,
        total_pages: response.total_pages || 0,
        total_results: response.total_results || 0
      };
    } catch (error) {
      this.logger.error(`Error getting popular movies: ${error.message}`, error.stack);
      return {
        results: [],
        page: 1,
        total_pages: 0,
        total_results: 0
      };
    }
  }

  async findByTmdbId(tmdbId: number): Promise<Movie | null> {
    const cacheKey = this.cacheKeyFactory.movie.byTmdbId(tmdbId);
    return this.cacheService.getOrFetch(
      cacheKey,
      async () => {
        try {
          return await this.moviesRepository.findOne({
            where: { tmdbId },
            relations: ['reviews'],
          });
        } catch (error) {
          this.logger.error(`Error finding movie by TMDB ID ${tmdbId}: ${error.message}`, error.stack);
          return null;
        }
      },
      EntityCacheTTL.MOVIE_DETAILS
    );
  }

  async createOrUpdateFromTMDB(tmdbMovie: TMDBMovieDetails): Promise<Movie> {
    try {
      let movie = await this.findByTmdbId(tmdbMovie.id);
    
      const movieData: Partial<Movie> = {
        tmdbId: tmdbMovie.id,
        title: tmdbMovie.title,
        originalTitle: tmdbMovie.original_title || tmdbMovie.title,
        overview: tmdbMovie.overview || '',
        releaseYear: new Date(tmdbMovie.release_date).getFullYear(),
        posterPath: tmdbMovie.poster_path || undefined,
        backdropPath: tmdbMovie.backdrop_path || undefined,
        genres: tmdbMovie.genres.map(g => g.name),
        runtime: tmdbMovie.runtime || undefined,
        languages: tmdbMovie.spoken_languages?.map(l => l.iso_639_1) || [],
        isAdult: tmdbMovie.adult,
        voteAverage: tmdbMovie.vote_average,
        voteCount: tmdbMovie.vote_count,
        isPopular: (tmdbMovie.popularity ?? 0) > 20
      };
    
      if (!movie) {
        movie = this.moviesRepository.create(movieData);
      } else {
        Object.assign(movie, movieData);
      }
    
      const saved = await this.moviesRepository.save(movie);
      
      await Promise.all([
        this.clearEntityCache(saved.id),
        this.cacheService.invalidate(this.cacheKeyFactory.movie.byTmdbId(tmdbMovie.id))
      ]);
      
      return saved;
    } catch (error) {
      this.logger.error(`Error creating/updating movie from TMDB: ${error.message}`, error.stack);
      throw error;
    }
  }

  async refreshMovieFromTMDB(tmdbId: number): Promise<Movie> {
    try {
      await this.tmdbService.invalidateMovieCache(tmdbId);
      const tmdbMovie = await this.tmdbService.getMovie(tmdbId);
      
      if (!tmdbMovie) {
        throw new NotFoundException(`Movie with TMDB ID ${tmdbId} not found`);
      }
      
      return this.createOrUpdateFromTMDB(tmdbMovie);
    } catch (error) {
      this.logger.error(`Error refreshing movie from TMDB: ${error.message}`, error.stack);
      throw error;
    }
  }
}