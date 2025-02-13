// src/modules/movies/services/tmdb.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  TMDBMovie,
  TMDBResponse,
  TMDBMovieDetails,
  TMDBCredits,
  TMDBVideoResponse,
  TMDBConfiguration,
  TMDBError
} from '../types/tmdb.types';

@Injectable()
export class TMDBService implements OnModuleInit {
  private readonly logger = new Logger(TMDBService.name);
  private readonly baseUrl = 'https://api.themoviedb.org/3';
  private readonly apiKey: string;
  private imageBaseUrl?: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    const apiKey = this.configService.get<string>('TMDB_API_KEY');
    if (!apiKey) {
      throw new Error('TMDB_API_KEY is not defined');
    }
    this.apiKey = apiKey;
  }

  async onModuleInit() {
    await this.initializeConfiguration();
  }

  private async initializeConfiguration() {
    try {
      const config = await this.get<TMDBConfiguration>('/configuration');
      this.imageBaseUrl = config.images.secure_base_url;
    } catch (error) {
      this.logger.error('Failed to initialize TMDB configuration', error);
    }
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
      const tmdbError = error.response?.data as TMDBError;
      throw new Error(tmdbError?.status_message || error.message);
    }
  }

  getImageUrl(path: string | undefined | null): string | undefined {
    if (!path) return undefined;
    return `${this.imageBaseUrl}original${path}`;
  }

  async searchMovies(query: string, page = 1): Promise<TMDBResponse> {
    return this.get<TMDBResponse>('/search/movie', { query, page });
  }

  async getMovie(id: number): Promise<TMDBMovieDetails> {
    return this.get<TMDBMovieDetails>(`/movie/${id}`);
  }

  async getMovieCredits(id: number): Promise<TMDBCredits> {
    return this.get<TMDBCredits>(`/movie/${id}/credits`);
  }

  async getMovieVideos(id: number): Promise<TMDBVideoResponse> {
    return this.get<TMDBVideoResponse>(`/movie/${id}/videos`);
  }

  async getSimilarMovies(id: number, page = 1): Promise<TMDBResponse> {
    return this.get<TMDBResponse>(`/movie/${id}/similar`, { page });
  }

  async getPopularMovies(page = 1): Promise<TMDBResponse> {
    return this.get<TMDBResponse>('/movie/popular', { page });
  }

  async getTopRatedMovies(page = 1): Promise<TMDBResponse> {
    return this.get<TMDBResponse>('/movie/top_rated', { page });
  }

  async getNowPlayingMovies(page = 1): Promise<TMDBResponse> {
    return this.get<TMDBResponse>('/movie/now_playing', { page });
  }

  async getUpcomingMovies(page = 1): Promise<TMDBResponse> {
    return this.get<TMDBResponse>('/movie/upcoming', { page });
  }

  async discoverMovies(options: {
    year?: number;
    genre?: number;
    sortBy?: string;
    withCast?: string;
    page?: number;
  }): Promise<TMDBResponse> {
    return this.get<TMDBResponse>('/discover/movie', options);
  }

  async getTrendingMovies(timeWindow: 'day' | 'week' = 'week', page = 1): Promise<TMDBResponse> {
    return this.get<TMDBResponse>(`/trending/movie/${timeWindow}`, { page });
  }
}