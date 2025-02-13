//src/modules/movies/movies.resolver.ts
import { Resolver, Query, Args, Int, ResolveField, Parent } from '@nestjs/graphql';
import { MoviesService } from './movies.service';
import { Movie } from './entities/movie.entity';
import { 
  TMDBMovie, 
  TMDBCredits, 
  TMDBVideo 
} from './types/tmdb.types';
import { UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '../../auth/guards/firebase-auth.guard';

@Resolver(() => Movie)
export class MoviesResolver {
  constructor(private readonly moviesService: MoviesService) {}

  @Query(() => [TMDBMovie])
  async searchMovies(
    @Args('query') query: string,
    @Args('page', { type: () => Int, nullable: true, defaultValue: 1 }) page: number,
  ): Promise<TMDBMovie[]> {
    return this.moviesService.searchMovies(query, page);
  }

  @Query(() => Movie)
  async movie(
    @Args('tmdbId', { type: () => Int }) tmdbId: number,
  ): Promise<Movie> {
    return this.moviesService.getMovieDetails(tmdbId);
  }

  @Query(() => [TMDBMovie])
  async popularMovies(
    @Args('page', { type: () => Int, nullable: true, defaultValue: 1 }) page: number,
  ): Promise<TMDBMovie[]> {
    return this.moviesService.getPopularMovies(page);
  }

  @Query(() => [TMDBMovie])
  async topRatedMovies(
    @Args('page', { type: () => Int, nullable: true, defaultValue: 1 }) page: number,
  ): Promise<TMDBMovie[]> {
    return this.moviesService.getTopRatedMovies(page);
  }

  @Query(() => [TMDBMovie])
  async nowPlayingMovies(
    @Args('page', { type: () => Int, nullable: true, defaultValue: 1 }) page: number,
  ): Promise<TMDBMovie[]> {
    return this.moviesService.getNowPlayingMovies(page);
  }

  @Query(() => [TMDBMovie])
  async upcomingMovies(
    @Args('page', { type: () => Int, nullable: true, defaultValue: 1 }) page: number,
  ): Promise<TMDBMovie[]> {
    return this.moviesService.getUpcomingMovies(page);
  }

  @Query(() => [TMDBMovie])
  async discoverMovies(
    @Args('genreId', { type: () => Int, nullable: true }) genreId?: number,
    @Args('year', { type: () => Int, nullable: true }) year?: number,
    @Args('page', { type: () => Int, nullable: true, defaultValue: 1 }) page?: number,
  ): Promise<TMDBMovie[]> {
    return this.moviesService.discoverMovies({ 
      genre: genreId,
      year,
      page,
    });
  }

  @Query(() => [TMDBMovie])
  async similarMovies(
    @Args('tmdbId', { type: () => Int }) tmdbId: number,
    @Args('page', { type: () => Int, nullable: true, defaultValue: 1 }) page: number,
  ): Promise<TMDBMovie[]> {
    return this.moviesService.getSimilarMovies(tmdbId, page);
  }

  @Query(() => TMDBMovie)
  async randomPopularMovie(): Promise<TMDBMovie> {
    return this.moviesService.getRandomPopularMovie();
  }

  @Query(() => [TMDBMovie])
  async trendingMovies(
    @Args('timeWindow', { type: () => String, defaultValue: 'week' }) timeWindow: 'day' | 'week',
    @Args('page', { type: () => Int, nullable: true, defaultValue: 1 }) page: number,
  ): Promise<TMDBMovie[]> {
    return this.moviesService.getTrendingMovies(timeWindow, page);
  }

  // Field Resolvers
  @ResolveField('credits', () => TMDBCredits)
  async getCredits(@Parent() movie: Movie): Promise<TMDBCredits> {
    return this.moviesService.getMovieCredits(movie.tmdbId);
  }

  @ResolveField('videos', () => [TMDBVideo])
  async getVideos(@Parent() movie: Movie): Promise<TMDBVideo[]> {
    return this.moviesService.getMovieVideos(movie.tmdbId);
  }

  @ResolveField('posterUrl', () => String)
  getPosterUrl(@Parent() movie: Movie): string | undefined {
    return this.moviesService.getPosterUrl(movie.posterPath);
  }

  @ResolveField('backdropUrl', () => String)
  getBackdropUrl(@Parent() movie: Movie): string | undefined {
    return this.moviesService.getBackdropUrl(movie.backdropPath);
  }
}