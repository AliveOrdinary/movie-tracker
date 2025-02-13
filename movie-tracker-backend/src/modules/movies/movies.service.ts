// src/modules/movies/movies.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Movie } from './entities/movie.entity';
import { TMDBService } from './services/tmdb.service';
import {
  TMDBMovie,
  TMDBMovieDetails,
  TMDBCredits,
  TMDBVideo,
} from './types/tmdb.types';

@Injectable()
export class MoviesService {
  constructor(
    @InjectRepository(Movie)
    private moviesRepository: Repository<Movie>,
    private tmdbService: TMDBService,
  ) {}

  async findAll(): Promise<Movie[]> {
    return this.moviesRepository.find();
  }

  async findOne(id: string): Promise<Movie> {
    const movie = await this.moviesRepository.findOne({
      where: { id },
      relations: ['reviews'],
    });
    if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }
    return movie;
  }

  async findByTmdbId(tmdbId: number): Promise<Movie | null> {
    return this.moviesRepository.findOne({
      where: { tmdbId },
      relations: ['reviews'],
    });
  }

  async createOrUpdateFromTMDB(tmdbMovie: TMDBMovieDetails): Promise<Movie> {
    let movie = await this.findByTmdbId(tmdbMovie.id);

    if (!movie) {
      movie = this.moviesRepository.create({});
    }

    movie.tmdbId = tmdbMovie.id;
    movie.title = tmdbMovie.title;
    movie.originalTitle = tmdbMovie.original_title;
    movie.overview = tmdbMovie.overview || '';
    movie.releaseYear = new Date(tmdbMovie.release_date).getFullYear();
    movie.posterPath = tmdbMovie.poster_path || undefined;
    movie.backdropPath = tmdbMovie.backdrop_path || undefined;
    movie.genres = tmdbMovie.genres.map(g => g.name);
    movie.runtime = tmdbMovie.runtime || 0;
    movie.languages = tmdbMovie.original_language ? [tmdbMovie.original_language] : [];
    movie.isAdult = tmdbMovie.adult;

    return this.moviesRepository.save(movie);
  }

  async searchMovies(query: string, page = 1): Promise<TMDBMovie[]> {
    const response = await this.tmdbService.searchMovies(query, page);
    return response.results;
  }

  async getMovieDetails(tmdbId: number): Promise<Movie> {
    const tmdbMovie = await this.tmdbService.getMovie(tmdbId);
    return this.createOrUpdateFromTMDB(tmdbMovie);
  }

  async getMovieCredits(tmdbId: number): Promise<TMDBCredits> {
    return this.tmdbService.getMovieCredits(tmdbId);
  }

  async getSimilarMovies(tmdbId: number, page = 1): Promise<TMDBMovie[]> {
    const response = await this.tmdbService.getSimilarMovies(tmdbId, page);
    return response.results;
  }

  async getPopularMovies(page = 1): Promise<TMDBMovie[]> {
    const response = await this.tmdbService.getPopularMovies(page);
    return response.results;
  }

  async getTopRatedMovies(page = 1): Promise<TMDBMovie[]> {
    const response = await this.tmdbService.getTopRatedMovies(page);
    return response.results;
  }

  async getNowPlayingMovies(page = 1): Promise<TMDBMovie[]> {
    const response = await this.tmdbService.getNowPlayingMovies(page);
    return response.results;
  }

  async getUpcomingMovies(page = 1): Promise<TMDBMovie[]> {
    const response = await this.tmdbService.getUpcomingMovies(page);
    return response.results;
  }

  async getMovieVideos(tmdbId: number): Promise<TMDBVideo[]> {
    const response = await this.tmdbService.getMovieVideos(tmdbId);
    return response.results;
  }

  async getTrendingMovies(timeWindow: 'day' | 'week', page = 1): Promise<TMDBMovie[]> {
    const response = await this.tmdbService.getTrendingMovies(timeWindow, page);
    return response.results;
  }

  async getRandomPopularMovie(): Promise<TMDBMovie> {
    const movies = await this.getPopularMovies(1);
    const randomIndex = Math.floor(Math.random() * movies.length);
    return movies[randomIndex];
  }

  async discoverMovies(options: {
    year?: number;
    genre?: number;
    sortBy?: string;
    page?: number;
  }): Promise<TMDBMovie[]> {
    const response = await this.tmdbService.discoverMovies(options);
    return response.results;
  }

  // Image URL helpers
  getPosterUrl(path: string | null | undefined): string | undefined {
    return path ? this.tmdbService.getImageUrl(path) : undefined;
  }

  getBackdropUrl(path: string | null | undefined): string | undefined {
    return path ? this.tmdbService.getImageUrl(path) : undefined;
  }
}