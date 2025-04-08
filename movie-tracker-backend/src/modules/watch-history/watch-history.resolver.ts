// src/modules/watch-history/watch-history.resolver.ts
import { Resolver, Query, Mutation, Args, Int, ResolveField, Parent, Float } from '@nestjs/graphql';
import { UseGuards, Logger, NotFoundException, InternalServerErrorException, ForbiddenException } from '@nestjs/common';
import { WatchHistoryService } from './watch-history.service';
import { WatchHistory } from './entities/watch-history.entity';
import { CreateWatchInput } from './dto/create-watch.input';
import { UpdateWatchInput } from './dto/update-watch.input';
import { WatchHistoryFiltersInput } from './dto/watch-history-filters.input';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { Movie } from '../movies/entities/movie.entity';
import { WatchHistoryStats } from './types/watch-history-stats.type';

@Resolver(() => WatchHistory)
@UseGuards(AuthGuard)
export class WatchHistoryResolver {
  private readonly logger = new Logger(WatchHistoryResolver.name);
  
  constructor(private readonly watchHistoryService: WatchHistoryService) {}

  @Mutation(() => WatchHistory)
  async createWatch(
    @CurrentUser() user: User,
    @Args('input') input: CreateWatchInput,
  ): Promise<WatchHistory> {
    this.logger.log(`Creating watch history entry for user ${user.id} and movie with TMDB ID ${input.tmdbId}`);
    try {
      return this.watchHistoryService.create({
        ...input,
        userId: user.id
      });
    } catch (error) {
      this.logger.error(`Error creating watch: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to create watch history entry');
    }
  }

  @Query(() => [WatchHistory])
  async watchHistory(
    @CurrentUser() user: User,
    @Args('page', { type: () => Float, nullable: true, defaultValue: 10 }) page?: number,
    @Args('limit', { type: () => Float, nullable: true, defaultValue: 10 }) limit?: number,
    @Args('filters', { nullable: true }) filters?: WatchHistoryFiltersInput,
  ): Promise<WatchHistory[]> {
    try {
      const mergedFilters = {
        ...filters,
        page: page || filters?.page || 1,
        limit: limit || filters?.limit || 10
      };
      
      const [watches] = await this.watchHistoryService.getUserWatchHistory(user.id, mergedFilters);
      return watches;
    } catch (error) {
      this.logger.error(`Error getting watch history: ${error.message}`, error.stack);
      return [];
    }
  }

  @Query(() => Int)
  async watchHistoryCount(
    @CurrentUser() user: User,
    @Args('filters', { nullable: true }) filters?: WatchHistoryFiltersInput,
  ): Promise<number> {
    try {
      const [, count] = await this.watchHistoryService.getUserWatchHistory(user.id, filters);
      return count;
    } catch (error) {
      this.logger.error(`Error getting watch history count: ${error.message}`, error.stack);
      return 0;
    }
  }

  @Query(() => WatchHistory)
  async watch(
    @CurrentUser() user: User,
    @Args('id') id: string,
  ): Promise<WatchHistory> {
    try {
      return this.watchHistoryService.findOneByUser(id, user);
    } catch (error) {
      this.logger.error(`Error getting watch: ${error.message}`, error.stack);
      
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Failed to get watch history entry');
    }
  }

  @Query(() => [WatchHistory])
  async movieWatchHistory(
    @CurrentUser() user: User,
    @Args('movieId') movieId: string,
  ): Promise<WatchHistory[]> {
    try {
      return this.watchHistoryService.getAllWatchesByMovieAndUser(movieId, user.id);
    } catch (error) {
      this.logger.error(`Error getting movie watch history: ${error.message}`, error.stack);
      return [];
    }
  }

  @Mutation(() => WatchHistory)
  async updateWatch(
    @CurrentUser() user: User,
    @Args('id') id: string,
    @Args('input') input: UpdateWatchInput,
  ): Promise<WatchHistory> {
    try {
      return this.watchHistoryService.updateWithUserId(id, input, user.id);
    } catch (error) {
      this.logger.error(`Error updating watch: ${error.message}`, error.stack);
      
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Failed to update watch history entry');
    }
  }

  @Mutation(() => Boolean)
  async deleteWatch(
    @CurrentUser() user: User,
    @Args('id') id: string,
  ): Promise<boolean> {
    try {
      return this.watchHistoryService.remove(id, user.id);
    } catch (error) {
      this.logger.error(`Error deleting watch: ${error.message}`, error.stack);
      
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Failed to delete watch history entry');
    }
  }

  @Mutation(() => WatchHistory)
  async toggleFavoriteWatch(
    @CurrentUser() user: User,
    @Args('id') id: string,
  ): Promise<WatchHistory> {
    try {
      return this.watchHistoryService.toggleFavorite(id, user.id);
    } catch (error) {
      this.logger.error(`Error toggling favorite: ${error.message}`, error.stack);
      
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Failed to toggle favorite status');
    }
  }

  @Mutation(() => [WatchHistory])
  async addBulkWatches(
    @CurrentUser() user: User,
    @Args('tmdbIds', { type: () => [Int] }) tmdbIds: number[],
    @Args('date') date: Date,
  ): Promise<WatchHistory[]> {
    try {
      return this.watchHistoryService.addBulkWatches(tmdbIds, date, user.id);
    } catch (error) {
      this.logger.error(`Error adding bulk watches: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to add bulk watches');
    }
  }

  @Query(() => WatchHistoryStats)
  async watchStats(
    @CurrentUser() user: User,
  ): Promise<WatchHistoryStats> {
    try {
      return this.watchHistoryService.getStats(user.id);
    } catch (error) {
      this.logger.error(`Error getting watch stats: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to get watch statistics');
    }
  }

  @Query(() => WatchHistoryStats)
  async userWatchStats(
    @Args('userId') userId: string,
  ): Promise<WatchHistoryStats> {
    try {
      return this.watchHistoryService.getStats(userId);
    } catch (error) {
      this.logger.error(`Error getting user watch stats: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to get user watch statistics');
    }
  }

  @Query(() => WatchHistoryStats)
  async movieWatchStats(
    @CurrentUser() user: User,
    @Args('movieId') movieId: string,
  ): Promise<any> {
    try {
      return this.watchHistoryService.getDetailedMovieWatchStats(movieId, user.id);
    } catch (error) {
      this.logger.error(`Error getting movie watch stats: ${error.message}`, error.stack);
      return {
        watchCount: 0,
        firstWatchDate: null,
        lastWatchDate: null,
        averageRating: 0,
        isFavorite: false
      };
    }
  }

  @Query(() => Int)
  async currentWatchStreak(
    @CurrentUser() user: User,
  ): Promise<number> {
    try {
      const { currentStreak } = await this.watchHistoryService.getWatchStreak(user.id);
      return currentStreak;
    } catch (error) {
      this.logger.error(`Error getting current watch streak: ${error.message}`, error.stack);
      return 0;
    }
  }

  @Query(() => Int)
  async longestWatchStreak(
    @CurrentUser() user: User,
  ): Promise<number> {
    try {
      const { longestStreak } = await this.watchHistoryService.getWatchStreak(user.id);
      return longestStreak;
    } catch (error) {
      this.logger.error(`Error getting longest watch streak: ${error.message}`, error.stack);
      return 0;
    }
  }

  // ResolveFIelds for better field-level caching
  @ResolveField('user', () => User, { nullable: true })
  async getUser(@Parent() watchHistory: WatchHistory): Promise<User | null> {
    try {
      // Return the already loaded user if available
      if (watchHistory.user) {
        return watchHistory.user;
      }
      
      // Otherwise, load from parent entity
      const result = await this.watchHistoryService.findOne(watchHistory.id, ['user']);
      return result ? result.user : null;
    } catch (error) {
      this.logger.error(`Error resolving user for watch ${watchHistory.id}: ${error.message}`, error.stack);
      return null;
    }
  }
  
  @ResolveField('movie', () => Movie, { nullable: true })
  async getMovie(@Parent() watchHistory: WatchHistory): Promise<Movie | null> {
    try {
      // Return the already loaded movie if available
      if (watchHistory.movie) {
        return watchHistory.movie;
      }
      
      // Otherwise, load from parent entity
      const result = await this.watchHistoryService.findOne(watchHistory.id, ['movie']);
      return result ? result.movie : null;
    } catch (error) {
      this.logger.error(`Error resolving movie for watch ${watchHistory.id}: ${error.message}`, error.stack);
      return null;
    }
  }
}