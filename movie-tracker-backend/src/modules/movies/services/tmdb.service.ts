// src/modules/movies/services/tmdb.service.ts
import { Injectable, Logger, OnModuleInit, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CacheService } from '../../../common/services/cache.service';
import { CacheKeyFactory } from '../../../common/factories/cache-key.factory';
import { CacheTTL, EntityCacheTTL } from '../../../common/constants/cache-ttl.constants';
import {
  TMDBMovie,
  TMDBResponse,
  TMDBMovieDetails,
  TMDBCredits,
  TMDBVideoResponse,
  TMDBConfiguration,
  TMDBError,
  TMDBWatchProvidersResponse,
  TMDBGenresResponse
} from '../types/tmdb.types';
import { DiscoverMoviesInput } from '../dto/discover-movies.input';
  
@Injectable()
export class TMDBService implements OnModuleInit {
  private readonly logger = new Logger(TMDBService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private imageBaseUrl?: string;
  private genres: Record<number, string> = {};

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly cacheService: CacheService,
    protected readonly cacheKeyFactory: CacheKeyFactory,
  ) {
    this.baseUrl = this.configService.get<string>('TMDB_API_BASE_URL', 'https://api.themoviedb.org/3');
    const apiKey = this.configService.get<string>('TMDB_API_KEY');
    
    if (!apiKey) {
      throw new Error('TMDB_API_KEY is not defined');
    }
    
    this.apiKey = apiKey;
  }

  async onModuleInit() {
    try {
      await this.initializeConfiguration();
      await this.loadGenres();
      this.logger.log('TMDB Service initialized successfully');
    } catch (error) {
      this.logger.error('Error during TMDB Service initialization:', error);
    }
  }

  private async initializeConfiguration() {
    try {
      const cacheKey = this.cacheKeyFactory.generate('tmdb', 'config');
      const config = await this.cacheService.getOrFetch<TMDBConfiguration>(
        cacheKey,
        () => this.get<TMDBConfiguration>('/configuration'),
        CacheTTL.VERY_LONG // Configuration rarely changes
      );
      
      this.imageBaseUrl = config.images.secure_base_url;
      this.logger.log('TMDB configuration loaded successfully');
    } catch (error) {
      this.logger.error('Failed to initialize TMDB configuration', error);
      throw new Error('Failed to initialize TMDB configuration');
    }
  }

  private async loadGenres() {
    try {
      const cacheKey = this.cacheKeyFactory.movie.genres();
      const genresResponse = await this.cacheService.getOrFetch<TMDBGenresResponse>(
        cacheKey,
        () => this.get<TMDBGenresResponse>('/genre/movie/list'),
        EntityCacheTTL.MOVIE_GENRES
      );
      
      genresResponse.genres.forEach(genre => {
        this.genres[genre.id] = genre.name;
      });
      
      this.logger.log(`Loaded ${Object.keys(this.genres).length} genres from TMDB`);
    } catch (error) {
      this.logger.error('Failed to load genres from TMDB', error);
    }
  }

  getGenreName(id: number): string {
    return this.genres[id] || 'Unknown';
  }

  getGenreId(name: string): number | undefined {
    const entry = Object.entries(this.genres).find(([_, genreName]) => 
      genreName.toLowerCase() === name.toLowerCase()
    );
    return entry ? parseInt(entry[0], 10) : undefined;
  }

  getAllGenres(): { id: number, name: string }[] {
    return Object.entries(this.genres).map(([id, name]) => ({
      id: parseInt(id, 10),
      name
    }));
  }

  private async get<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get<T>(`${this.baseUrl}${endpoint}`, {
          params: {
            api_key: this.apiKey,
            ...params,
          },
        })
      );

      return data;
    } catch (error) {
      this.logger.error(`TMDB API error: ${endpoint}`, error.response?.data || error.message);
      
      const tmdbError = error.response?.data as TMDBError;
      const statusCode = error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
      
      throw new HttpException(
        tmdbError?.status_message || 'An error occurred with the movie database',
        statusCode
      );
    }
  }

  getImageUrl(path: string | undefined | null): string | undefined {
    if (!path) return undefined;
    return `${this.imageBaseUrl}original${path}`;
  }

  async searchMovies(query: string, page = 1): Promise<TMDBResponse> {
    const cacheKey = this.cacheKeyFactory.movie.search(query, page);
    return this.cacheService.getOrFetch<TMDBResponse>(
      cacheKey,
      () => this.get<TMDBResponse>('/search/movie', { query, page }),
      EntityCacheTTL.MOVIE_SEARCH
    );
  }

  async getMovie(id: number): Promise<TMDBMovieDetails> {
    if (!id || isNaN(id)) {
      this.logger.error(`Invalid TMDB ID: ${id}`);
      throw new HttpException('Invalid TMDB ID', HttpStatus.BAD_REQUEST);
    }

    this.logger.log(`Fetching movie details for TMDB ID: ${id}`);
    const cacheKey = this.cacheKeyFactory.movie.details(id);
    return this.cacheService.getOrFetch<TMDBMovieDetails>(
      cacheKey,
      () => this.get<TMDBMovieDetails>(`/movie/${id}`),
      EntityCacheTTL.MOVIE_DETAILS
    );
  }

  async getMovieCredits(id: number): Promise<TMDBCredits> {
    const cacheKey = this.cacheKeyFactory.movie.credits(id);
    return this.cacheService.getOrFetch<TMDBCredits>(
      cacheKey,
      () => this.get<TMDBCredits>(`/movie/${id}/credits`),
      EntityCacheTTL.MOVIE_CREDITS
    );
  }

  async getMovieVideos(id: number): Promise<TMDBVideoResponse> {
    const cacheKey = this.cacheKeyFactory.movie.videos(id);
    return this.cacheService.getOrFetch<TMDBVideoResponse>(
      cacheKey,
      () => this.get<TMDBVideoResponse>(`/movie/${id}/videos`),
      EntityCacheTTL.MOVIE_VIDEOS
    );
  }

  async getSimilarMovies(id: number, page = 1): Promise<TMDBResponse> {
    const cacheKey = this.cacheKeyFactory.movie.similar(id, page);
    return this.cacheService.getOrFetch<TMDBResponse>(
      cacheKey,
      () => this.get<TMDBResponse>(`/movie/${id}/similar`, { page }),
      EntityCacheTTL.MOVIE_SIMILAR
    );
  }

  async getRecommendations(id: number, page = 1): Promise<TMDBResponse> {
    const cacheKey = this.cacheKeyFactory.movie.recommendations(id, page);
    return this.cacheService.getOrFetch<TMDBResponse>(
      cacheKey,
      () => this.get<TMDBResponse>(`/movie/${id}/recommendations`, { page }),
      EntityCacheTTL.MOVIE_RECOMMENDATIONS
    );
  }

  async getPopularMovies(page = 1): Promise<TMDBResponse> {
    const cacheKey = this.cacheKeyFactory.movie.popular(page);
    return this.cacheService.getOrFetch<TMDBResponse>(
      cacheKey,
      () => this.get<TMDBResponse>('/movie/popular', { page }),
      EntityCacheTTL.MOVIE_POPULAR
    );
  }

  async getTopRatedMovies(page = 1): Promise<TMDBResponse> {
    const cacheKey = this.cacheKeyFactory.movie.topRated(page);
    return this.cacheService.getOrFetch<TMDBResponse>(
      cacheKey,
      () => this.get<TMDBResponse>('/movie/top_rated', { page }),
      EntityCacheTTL.MOVIE_TOP_RATED
    );
  }

  async getNowPlayingMovies(page = 1): Promise<TMDBResponse> {
    const cacheKey = this.cacheKeyFactory.movie.nowPlaying(page);
    return this.cacheService.getOrFetch<TMDBResponse>(
      cacheKey,
      () => this.get<TMDBResponse>('/movie/now_playing', { page }),
      EntityCacheTTL.MOVIE_NOW_PLAYING
    );
  }

  async getUpcomingMovies(page = 1): Promise<TMDBResponse> {
    const cacheKey = this.cacheKeyFactory.movie.upcoming(page);
    return this.cacheService.getOrFetch<TMDBResponse>(
      cacheKey,
      () => this.get<TMDBResponse>('/movie/upcoming', { page }),
      EntityCacheTTL.MOVIE_UPCOMING
    );
  }

  async getMovieWatchProviders(id: number): Promise<TMDBWatchProvidersResponse> {
    const cacheKey = this.cacheKeyFactory.movie.watchProviders(id);
    return this.cacheService.getOrFetch<TMDBWatchProvidersResponse>(
      cacheKey,
      () => this.get<TMDBWatchProvidersResponse>(`/movie/${id}/watch/providers`),
      EntityCacheTTL.MOVIE_PROVIDERS
    );
  }

  async discoverMovies(options: DiscoverMoviesInput): Promise<TMDBResponse> {
    const params: Record<string, any> = {
      page: options.page || 1,
      sort_by: options.sortBy || 'popularity.desc',
      include_adult: options.includeAdult || false,
    };

    if (options.year) {
      params.primary_release_year = options.year;
    }

    if (options.genre) {
      params.with_genres = options.genre.toString();
    } else if (options.genreIds && options.genreIds.length > 0) {
      params.with_genres = options.genreIds.join(',');
    }

    if (options.voteAverageGte) {
      params.vote_average_gte = options.voteAverageGte;
    }

    if (options.voteCountGte) {
      params.vote_count_gte = options.voteCountGte;
    }

    if (options.releaseDateGte) {
      params.primary_release_date_gte = options.releaseDateGte;
    }

    if (options.releaseDateLte) {
      params.primary_release_date_lte = options.releaseDateLte;
    }

    if (options.originalLanguage) {
      params.with_original_language = options.originalLanguage;
    }

    if (options.withKeywords && options.withKeywords.length > 0) {
      params.with_keywords = options.withKeywords.join(',');
    }

    if (options.withoutKeywords && options.withoutKeywords.length > 0) {
      params.without_keywords = options.withoutKeywords.join(',');
    }

    if (options.region) {
      params.region = options.region;
    }

    // Create a unique cache key based on all params
    const cacheKey = `discover:${JSON.stringify(params)}`;
    
    return this.cacheService.getOrFetch<TMDBResponse>(
      cacheKey,
      () => this.get<TMDBResponse>('/discover/movie', params),
      EntityCacheTTL.MOVIE_SEARCH
    );
  }

  async getMoviesByGenre(genreId: number, page = 1): Promise<TMDBResponse> {
    const cacheKey = this.cacheKeyFactory.movie.byGenre(genreId, page);
    return this.cacheService.getOrFetch<TMDBResponse>(
      cacheKey,
      () => this.discoverMovies({
        genre: genreId,
        page,
        sortBy: 'popularity.desc'
      }),
      EntityCacheTTL.MOVIE_POPULAR
    );
  }

  async getTrendingMovies(timeWindow: 'day' | 'week' = 'week', page = 1): Promise<TMDBResponse> {
    const cacheKey = this.cacheKeyFactory.movie.trending(timeWindow);
    return this.cacheService.getOrFetch<TMDBResponse>(
      cacheKey,
      () => this.get<TMDBResponse>(`/trending/movie/${timeWindow}`, { page }),
      EntityCacheTTL.MOVIE_TRENDING
    );
  }

  async getGenres(): Promise<TMDBGenresResponse> {
    const cacheKey = this.cacheKeyFactory.movie.genres();
    return this.cacheService.getOrFetch<TMDBGenresResponse>(
      cacheKey,
      () => this.get<TMDBGenresResponse>('/genre/movie/list'),
      EntityCacheTTL.MOVIE_GENRES
    );
  }

  async getMovieKeywords(id: number): Promise<any> {
    const cacheKey = this.cacheKeyFactory.generate('movie', 'keywords', [id]);
    return this.cacheService.getOrFetch<any>(
      cacheKey,
      () => this.get<any>(`/movie/${id}/keywords`),
      EntityCacheTTL.MOVIE_DETAILS
    );
  }
  
  async invalidateMovieCache(id: number): Promise<void> {
    // Invalidate all related movie caches
    await Promise.all([
      this.cacheService.invalidate(this.cacheKeyFactory.movie.details(id)),
      this.cacheService.invalidate(this.cacheKeyFactory.movie.credits(id)),
      this.cacheService.invalidate(this.cacheKeyFactory.movie.videos(id)),
      this.cacheService.invalidate(this.cacheKeyFactory.movie.similar(id, 1)),
      this.cacheService.invalidate(this.cacheKeyFactory.movie.recommendations(id, 1)),
      this.cacheService.invalidate(this.cacheKeyFactory.movie.watchProviders(id))
    ]);
    
    // Also invalidate patterns that might contain this movie
    await Promise.all([
      this.cacheService.invalidatePattern('popular'),
      this.cacheService.invalidatePattern('trending'),
      this.cacheService.invalidatePattern('top-rated'),
      this.cacheService.invalidatePattern('now-playing')
    ]);
    
    this.logger.log(`Cache invalidated for movie ${id}`);
  }
}