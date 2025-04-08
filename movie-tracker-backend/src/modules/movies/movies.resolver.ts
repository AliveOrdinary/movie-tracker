import { Resolver, Query, Args, Int, ResolveField, Parent } from '@nestjs/graphql';
import { Injectable, Logger } from '@nestjs/common';
import { MoviesService } from './movies.service';
import { Movie, MovieImages } from './entities/movie.entity';
import { Public } from '../../auth/guards/auth.guard';
import { PaginatedMovies } from './types/paginated-movies.type';
import { TMDBResponse, TMDBMovieDetails, TMDBLanguage, TMDBMovie, TMDBGenre } from './types/tmdb.types';
import { DiscoverMoviesInput } from './dto/discover-movies.input';

@Injectable()
@Resolver(() => Movie)
export class MoviesResolver {
  private readonly logger = new Logger(MoviesResolver.name);

  constructor(private readonly moviesService: MoviesService) {}

  @Query(() => Movie, { name: 'movie' })
  @Public()
  async movie(
    @Args('tmdbId', { type: () => Int }) tmdbId: number
  ): Promise<Movie> {
    this.logger.log(`Fetching movie details for TMDB ID: ${tmdbId}`);
    
    try {
      let movie = await this.moviesService.findByTmdbId(tmdbId);
      
      if (!movie) {
        this.logger.log(`Movie not found in database, fetching from TMDB API: ${tmdbId}`);
        const tmdbMovie = await this.moviesService.tmdbService.getMovie(tmdbId);
        movie = await this.moviesService.createOrUpdateFromTMDB(tmdbMovie);
      }
      
      if (!movie) {
        throw new Error(`Movie with TMDB ID ${tmdbId} not found`);
      }
      
      return movie;
    } catch (error) {
      this.logger.error(`Error fetching movie with TMDB ID ${tmdbId}: ${error.message}`);
      throw error;
    }
  }

  // ResolveField for poster URL
  @ResolveField(() => String, { name: 'posterUrl', nullable: true })
  getPosterUrl(@Parent() movie: Movie): string | null {
    if (!movie.posterPath) return null;
    return `https://image.tmdb.org/t/p/w500${movie.posterPath}`;
  }

  // ResolveField for backdrop URL
  @ResolveField(() => String, { name: 'backdropUrl', nullable: true })
  getBackdropUrl(@Parent() movie: Movie): string | null {
    if (!movie.backdropPath) return null;
    return `https://image.tmdb.org/t/p/w1280${movie.backdropPath}`;
  }

  // ResolveField for images object
  @ResolveField(() => MovieImages, { name: 'images', nullable: true })
  getImages(@Parent() movie: Movie): { poster: string | null, backdrop: string | null } {
    return {
      poster: movie.posterPath ? `https://image.tmdb.org/t/p/w500${movie.posterPath}` : null,
      backdrop: movie.backdropPath ? `https://image.tmdb.org/t/p/w1280${movie.backdropPath}` : null
    };
  }

  @Query(() => [TMDBMovie])
  @Public()
  async nowPlayingMovies(
    @Args('page', { type: () => Int, nullable: true, defaultValue: 1 }) page: number
  ): Promise<TMDBMovie[]> {
    try {
      this.logger.log(`Fetching now playing movies, page: ${page}`);
      const response = await this.moviesService.getNowPlayingMovies(page);
      return response.results || [];
    } catch (error) {
      this.logger.error(`Error fetching now playing movies: ${error.message}`, error.stack);
      return [];
    }
  }

  @Query(() => PaginatedMovies)
  @Public()
  async discoverMovies(
    @Args('input', { nullable: true }) input: DiscoverMoviesInput
  ): Promise<PaginatedMovies> {
    try {
      const options = input || {};
      const response = await this.moviesService.tmdbService.discoverMovies(options);
      
      const processedMovies: Movie[] = [];
      for (const tmdbMovie of response.results || []) {
        try {
          let movie = await this.moviesService.findByTmdbId(tmdbMovie.id);
          
          if (!movie) {
            const movieDetails: TMDBMovieDetails = {
              ...tmdbMovie,
              genres: (tmdbMovie.genre_ids || []).map(id => ({ 
                id, 
                name: this.moviesService.tmdbService.getGenreName(id) 
              })),
              spoken_languages: [
                { 
                  iso_639_1: tmdbMovie.original_language || 'en',
                  name: tmdbMovie.original_language || 'English'
                }
              ],
              runtime: undefined
            };

            movie = await this.moviesService.createOrUpdateFromTMDB(movieDetails);
          }
          
          if (movie) {
            processedMovies.push(movie);
          }
        } catch (error) {
          this.logger.error(`Error processing discovered movie ${tmdbMovie.id}: ${error.message}`);
        }
      }
      
      return {
        results: processedMovies,
        page: response.page || 1,
        totalPages: response.total_pages || 0,
        totalResults: response.total_results || 0
      };
    } catch (error) {
      this.logger.error(`Error discovering movies: ${error.message}`, error.stack);
      return {
        results: [],
        page: 1,
        totalPages: 0,
        totalResults: 0
      };
    }
  }

  @Query(() => [TMDBMovie])
  @Public()
  async searchMovies(
    @Args('query', { type: () => String }) query: string,
    @Args('page', { type: () => Int, nullable: true, defaultValue: 1 }) page: number
  ): Promise<TMDBMovie[]> {
    try {
      this.logger.log(`Searching for movies: ${query}, page: ${page}`);
      const response = await this.moviesService.tmdbService.searchMovies(query, page);
      return response.results || [];
    } catch (error) {
      this.logger.error(`Error searching movies: ${error.message}`, error.stack);
      return [];
    }
  }

  @Query(() => [TMDBMovie])
  @Public()
  async topRatedMovies(
    @Args('page', { type: () => Int, nullable: true, defaultValue: 1 }) page: number
  ): Promise<TMDBMovie[]> {
    try {
      this.logger.log(`Fetching top rated movies, page: ${page}`);
      const response = await this.moviesService.tmdbService.getTopRatedMovies(page);
      return response.results || [];
    } catch (error) {
      this.logger.error(`Error fetching top rated movies: ${error.message}`, error.stack);
      return [];
    }
  }

  @Query(() => [TMDBMovie])
  @Public()
  async upcomingMovies(
    @Args('page', { type: () => Int, nullable: true, defaultValue: 1 }) page: number
  ): Promise<TMDBMovie[]> {
    try {
      this.logger.log(`Fetching upcoming movies, page: ${page}`);
      const response = await this.moviesService.tmdbService.getUpcomingMovies(page);
      return response.results || [];
    } catch (error) {
      this.logger.error(`Error fetching upcoming movies: ${error.message}`, error.stack);
      return [];
    }
  }

  @Query(() => [TMDBMovie])
  @Public()
  async trendingMovies(
    @Args('page', { type: () => Int, nullable: true, defaultValue: 1 }) page: number,
    @Args('timeWindow', { type: () => String, nullable: true, defaultValue: 'week' }) timeWindow: 'day' | 'week'
  ): Promise<TMDBMovie[]> {
    try {
      this.logger.log(`Fetching trending movies for ${timeWindow}, page: ${page}`);
      const response = await this.moviesService.tmdbService.getTrendingMovies(timeWindow, page);
      return response.results || [];
    } catch (error) {
      this.logger.error(`Error fetching trending movies: ${error.message}`, error.stack);
      return [];
    }
  }

  @Query(() => [TMDBMovie])
  @Public()
  async recommendedMovies(
    @Args('tmdbId', { type: () => Int }) tmdbId: number,
    @Args('page', { type: () => Int, nullable: true, defaultValue: 1 }) page: number
  ): Promise<TMDBMovie[]> {
    try {
      this.logger.log(`Fetching recommended movies for TMDB ID: ${tmdbId}, page: ${page}`);
      const response = await this.moviesService.tmdbService.getRecommendations(tmdbId, page);
      return response.results || [];
    } catch (error) {
      this.logger.error(`Error fetching recommended movies: ${error.message}`, error.stack);
      return [];
    }
  }

  @Query(() => [TMDBMovie])
  @Public()
  async similarMovies(
    @Args('tmdbId', { type: () => Int }) tmdbId: number,
    @Args('page', { type: () => Int, nullable: true, defaultValue: 1 }) page: number
  ): Promise<TMDBMovie[]> {
    try {
      this.logger.log(`Fetching similar movies for TMDB ID: ${tmdbId}, page: ${page}`);
      const response = await this.moviesService.tmdbService.getSimilarMovies(tmdbId, page);
      return response.results || [];
    } catch (error) {
      this.logger.error(`Error fetching similar movies: ${error.message}`, error.stack);
      return [];
    }
  }

  @Query(() => [TMDBMovie])
  @Public()
  async popularMovies(
    @Args('page', { type: () => Int, nullable: true, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 10 }) limit: number,
  ): Promise<TMDBMovie[]> {
    try {
      this.logger.log(`Fetching popular movies, page: ${page}`);
      const response = await this.moviesService.getPopularMovies(page);
      return response.results || [];
    } catch (error) {
      this.logger.error(`Error fetching popular movies: ${error.message}`, error.stack);
      return [];
    }
  }

  @Query(() => [TMDBGenre])
  @Public()
  async movieGenres(): Promise<any[]> {
    try {
      const genres = this.moviesService.tmdbService.getAllGenres();
      return genres;
    } catch (error) {
      this.logger.error(`Error fetching movie genres: ${error.message}`, error.stack);
      return [];
    }
  }
}