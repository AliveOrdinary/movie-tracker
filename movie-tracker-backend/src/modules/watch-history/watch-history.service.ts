// src/modules/watch-history/watch-history.service.ts
import { ForbiddenException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Between, Like, ILike, MoreThan, LessThan } from 'typeorm';
import { WatchHistory } from './entities/watch-history.entity';
import { CreateWatchInput } from './dto/create-watch.input';
import { UpdateWatchInput } from './dto/update-watch.input';
import { WatchHistoryFiltersInput } from './dto/watch-history-filters.input';
import { User } from '../users/entities/user.entity';
import { Movie } from '../movies/entities/movie.entity';
import { WatchType } from 'src/common/enums';
import { BaseService } from '../../common/services/base.service';
import { CacheService } from '../../common/services/cache.service';
import { CacheKeyFactory } from '../../common/factories/cache-key.factory';
import { EntityCacheTTL } from '../../common/constants/cache-ttl.constants';
import { 
  WatchHistoryStats, 
  GenreDistribution,
  YearDistribution,
  WatchTypeDistribution,
  MonthlyWatchCount
} from './types/watch-history-stats.type';
import { DeepPartial } from 'typeorm';

@Injectable()
export class WatchHistoryService extends BaseService<WatchHistory> {
  protected readonly logger = new Logger(WatchHistoryService.name);

  constructor(
    @InjectRepository(WatchHistory)
    protected readonly watchHistoryRepository: Repository<WatchHistory>,
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    protected readonly cacheService: CacheService,
    protected readonly cacheKeyFactory: CacheKeyFactory,
  ) {
    super(watchHistoryRepository, cacheService, 'watchHistory', cacheKeyFactory);
  }

  async create(createWatchDto: CreateWatchInput & { userId: string, movieEntity?: any }): Promise<WatchHistory> {
    try {
      // Use the provided movie entity if available
      const movieId = createWatchDto.movieEntity?.id;
      
      if (!movieId) {
        throw new Error('No movie entity provided. Movie ID is required for watch history entries.');
      }

      // First check if this is a rewatch
      const existingWatch = await this.watchHistoryRepository.findOne({
        where: {
          userId: createWatchDto.userId,
          movieId: movieId,
        },
        order: {
          watchedAt: 'DESC'
        }
      });

      // If this is a rewatch, mark it appropriately
      if (existingWatch && createWatchDto.watchType === WatchType.REWATCH) {
        const watchCount = (existingWatch.watchCount || 1) + 1;
  
        // Create a new entry for this rewatch
        const watch = this.watchHistoryRepository.create({
          ...createWatchDto,
          user: { id: createWatchDto.userId },
          movie: { id: movieId },
          watchCount
        });
  
        const saved = await this.watchHistoryRepository.save(watch);
        await this.clearEntityCache(saved.id);
        await this.clearUserWatchStatsCache(createWatchDto.userId);
        return saved;
      } else {
        // First time watch or not explicitly marked as rewatch
        const watch = this.watchHistoryRepository.create({
          ...createWatchDto,
          user: { id: createWatchDto.userId },
          movie: { id: movieId },
          watchCount: 1
        });
  
        const saved = await this.watchHistoryRepository.save(watch);
        await this.clearEntityCache(saved.id);
        await this.clearUserWatchStatsCache(createWatchDto.userId);
        return saved;
      }
    } catch (error) {
      this.logger.error(`Error creating watch history entry: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findByMovieAndUser(movieId: string, userId: string): Promise<WatchHistory | null> {
    try {
      const cacheKey = this.cacheKeyFactory.generate('watchHistory', 'movieUser', [movieId, userId]);
      
      return this.cacheService.getOrFetch(
        cacheKey,
        async () => {
          const watch = await this.watchHistoryRepository.findOne({
            where: {
              movieId,
              userId
            },
            relations: ['movie', 'user'],
            order: { watchedAt: 'DESC' }
          });
          
          return watch || null;
        },
        EntityCacheTTL.MEDIUM
      );
    } catch (error) {
      this.logger.error(`Error finding watch history for movie ${movieId} and user ${userId}: ${error.message}`, error.stack);
      return null;
    }
  }

  async getAllWatchesByMovieAndUser(movieId: string, userId: string): Promise<WatchHistory[]> {
    try {
      const cacheKey = this.cacheKeyFactory.generate('watchHistory', 'allMovieUser', [movieId, userId]);
      
      return this.cacheService.getOrFetch(
        cacheKey,
        async () => {
          return this.watchHistoryRepository.find({
            where: {
              movieId,
              userId
            },
            relations: ['movie'],
            order: { watchedAt: 'DESC' }
          });
        },
        EntityCacheTTL.SHORT
      );
    } catch (error) {
      this.logger.error(`Error finding all watches for movie ${movieId} and user ${userId}: ${error.message}`, error.stack);
      return [];
    }
  }

  async findOneByUser(id: string, user: User): Promise<WatchHistory> {
    try {
      const watch = await this.findOne(id, ['user', 'movie']);

      if (watch.userId !== user.id) {
        throw new ForbiddenException('You do not have permission to access this watch history entry');
      }

      return watch;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      
      this.logger.error(`Error finding watch ${id} for user ${user.id}: ${error.message}`, error.stack);
      throw new NotFoundException(`Watch history entry with ID ${id} not found`);
    }
  }

  async isInWatchlist(movieId: string, userId: string): Promise<boolean> {
    try {
      const cacheKey = this.cacheKeyFactory.generate('watchHistory', 'inWatchlist', [movieId, userId]);
      
      return this.cacheService.getOrFetch(
        cacheKey,
        async () => {
          const watchlistEntry = await this.watchHistoryRepository.findOne({
            where: { movieId, userId }
          });
          return !!watchlistEntry;
        },
        EntityCacheTTL.SHORT
      );
    } catch (error) {
      this.logger.error(`Error checking if movie ${movieId} is in watchlist for user ${userId}: ${error.message}`, error.stack);
      return false;
    }
  }

  // This method overrides the base class's update method with additional parameters
  // @override
  async updateWithUserId(id: string, updateData: UpdateWatchInput, userId: string): Promise<WatchHistory> {
    try {
      const watch = await this.findOne(id);
      
      if (!watch) {
        throw new NotFoundException(`Watch history with ID ${id} not found`);
      }
      
      if (watch.userId !== userId) {
        throw new ForbiddenException('You do not have permission to update this watch history entry');
      }

      // Merge the updates
      const updatedWatch = this.watchHistoryRepository.merge(watch, updateData as any);
      
      // Save and return the updated entity
      const saved = await this.watchHistoryRepository.save(updatedWatch);
      
      // Clear cache
      await this.clearEntityCache(id);
      await this.clearUserWatchStatsCache(userId);
      
      // Also clear movie-user specific caches
      const movieId = watch.movieId;
      await this.cacheService.invalidate(
        this.cacheKeyFactory.generate('watchHistory', 'movieUser', [movieId, userId])
      );
      await this.cacheService.invalidate(
        this.cacheKeyFactory.generate('watchHistory', 'allMovieUser', [movieId, userId])
      );
      
      return saved;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      
      this.logger.error(`Error updating watch ${id}: ${error.message}`, error.stack);
      throw new Error(`Failed to update watch history entry: ${error.message}`);
    }
  }

  async remove(id: string, userId: string): Promise<boolean> {
    try {
      // First find the watch to ensure user has permission
      const watch = await this.watchHistoryRepository.findOne({
        where: { id }
      });

      if (!watch) {
        throw new NotFoundException(`Watch history entry with ID ${id} not found`);
      }

      if (watch.userId !== userId) {
        throw new ForbiddenException('You do not have permission to delete this watch history entry');
      }

      const movieId = watch.movieId;
      const result = await this.watchHistoryRepository.delete(id);
      
      // Clear caches
      await this.clearEntityCache(id);
      await this.clearUserWatchStatsCache(userId);
      
      // Also clear movie-user specific caches
      await this.cacheService.invalidate(
        this.cacheKeyFactory.generate('watchHistory', 'movieUser', [movieId, userId])
      );
      await this.cacheService.invalidate(
        this.cacheKeyFactory.generate('watchHistory', 'allMovieUser', [movieId, userId])
      );
      
      return result.affected ? true : false;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      
      this.logger.error(`Error removing watch ${id}: ${error.message}`, error.stack);
      throw new Error(`Failed to delete watch history entry: ${error.message}`);
    }
  }

  async getUserWatchHistory(
    userId: string, 
    filters?: WatchHistoryFiltersInput
  ): Promise<[WatchHistory[], number]> {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const where: FindOptionsWhere<WatchHistory> = { userId };

      // Build cache key based on filters
      let cacheKey = this.cacheKeyFactory.generate('watchHistory', 'userHistory', [userId, page, limit]);
      if (filters) {
        cacheKey += `:${JSON.stringify(filters)}`;
      }
      
      return this.cacheService.getOrFetch(
        cacheKey,
        async () => {
          // Apply filters
          if (filters) {
            // Date range
            if (filters.startDate && filters.endDate) {
              where.watchedAt = Between(filters.startDate, filters.endDate);
            } else if (filters.startDate) {
              where.watchedAt = MoreThan(filters.startDate);
            } else if (filters.endDate) {
              where.watchedAt = LessThan(filters.endDate);
            }

            // Watch type
            if (filters.watchType) {
              where.watchType = filters.watchType;
            }

            // Rating range
            if (filters.minRating !== undefined) {
              where.rating = MoreThan(filters.minRating);
            }
            if (filters.maxRating !== undefined) {
              where.rating = LessThan(filters.maxRating);
            }

            // Favorites
            if (filters.onlyFavorites) {
              where.isFavorite = true;
            }

            // Privacy
            if (!filters.includePrivate) {
              where.isPrivate = false;
            }

            // Tag filter
            // Temporarily disable tag filtering until context_tags column is available
            // if (filters.tagFilter) {
            //   where.contextTags = ILike(`%${filters.tagFilter}%`);
            // }
          }

          // Special handling for search term - query across movie title and notes
          let query = this.watchHistoryRepository.createQueryBuilder('watch')
            .leftJoinAndSelect('watch.movie', 'movie')
            .where(where);

          if (filters?.searchTerm) {
            query = query.andWhere(
              '(movie.title ILIKE :term OR watch.notes ILIKE :term)',
              { term: `%${filters.searchTerm}%` }
            );
          }

          // Apply sorting
          const sortBy = filters?.sortBy || 'watchedAt';
          const sortDirection = filters?.sortDirection || 'DESC';
          query = query.orderBy(`watch.${sortBy}`, sortDirection as 'ASC' | 'DESC');

          // Apply pagination
          query = query
            .skip((page - 1) * limit)
            .take(limit);

          // Execute query
          return query.getManyAndCount();
        },
        EntityCacheTTL.SHORT
      );
    } catch (error) {
      this.logger.error(`Error getting user watch history for user ${userId}: ${error.message}`, error.stack);
      return [[], 0];
    }
  }

  async getStats(userId: string): Promise<WatchHistoryStats> {
    const cacheKey = this.cacheKeyFactory.generate('user', 'watchStats', [userId]);
    
    return this.cacheService.getOrFetch(
      cacheKey,
      async () => {
        try {
          // Get all watch history entries with movie data
          const watches = await this.watchHistoryRepository.find({
            where: { userId },
            relations: ['movie']
          });

          if (watches.length === 0) {
            return {
              totalWatch: 0,
              uniqueMovies: 0,
              totalWatchTime: 0,
              averageRating: 0,
              favoriteCount: 0,
              totalRewatches: 0,
              genreDistribution: [],
              yearDistribution: [],
              watchTypeDistribution: []
            };
          }

          // Basic stats
          const totalWatch = watches.length;
          const uniqueMovieIds = new Set(watches.map(w => w.movieId)).size;
          const totalWatchTime = watches.reduce((sum, w) => sum + (w.watchDuration || (w.movie?.runtime || 0)), 0);
          
          // Rating stats
          const watchesWithRating = watches.filter(w => w.rating !== null && w.rating !== undefined);
          const averageRating = watchesWithRating.length 
            ? watchesWithRating.reduce((sum, w) => sum + (w.rating || 0), 0) / watchesWithRating.length 
            : 0;

          // Mood rating stats
          const watchesWithMoodRating = watches.filter(w => w.moodRating !== null && w.moodRating !== undefined);
          const averageMoodRating = watchesWithMoodRating.length 
            ? watchesWithMoodRating.reduce((sum, w) => sum + (w.moodRating || 0), 0) / watchesWithMoodRating.length 
            : 0;

          // Favorite count
          const favoriteCount = watches.filter(w => w.isFavorite).length;

          // Rewatch stats
          const totalRewatches = watches.filter(w => w.watchType === WatchType.REWATCH).length;
          const averageWatchesPerMovie = totalWatch / (uniqueMovieIds || 1);

          // Date stats
          const sortedWatches = [...watches].sort((a, b) => 
            new Date(a.watchedAt).getTime() - new Date(b.watchedAt).getTime()
          );
          const firstWatchDate = sortedWatches.length ? sortedWatches[0].watchedAt : null;
          const lastWatchDate = sortedWatches.length ? sortedWatches[sortedWatches.length - 1].watchedAt : null;
          
          // Total days between first and last watch
          const totalDays = firstWatchDate && lastWatchDate 
            ? Math.ceil((lastWatchDate.getTime() - firstWatchDate.getTime()) / (1000 * 60 * 60 * 24))
            : 0;

          // Genre distribution
          const genreCounts = {};
          let totalGenreCounts = 0;
          
          watches.forEach(watch => {
            if (watch.movie?.genres) {
              watch.movie.genres.forEach(genre => {
                genreCounts[genre] = (genreCounts[genre] || 0) + 1;
                totalGenreCounts++;
              });
            }
          });

          const genreDistribution: GenreDistribution[] = Object.entries(genreCounts)
            .map(([genre, count]) => ({
              genre,
              count: count as number,
              percentage: totalGenreCounts ? (count as number) / totalGenreCounts * 100 : 0
            }))
            .sort((a, b) => b.count - a.count);

          // Release year distribution
          const yearCounts = {};
          watches.forEach(watch => {
            if (watch.movie?.releaseYear) {
              const year = watch.movie.releaseYear;
              yearCounts[year] = (yearCounts[year] || 0) + 1;
            }
          });

          const yearDistribution: YearDistribution[] = Object.entries(yearCounts)
            .map(([year, count]) => ({
              year: parseInt(year),
              count: count as number,
              percentage: totalWatch ? (count as number) / totalWatch * 100 : 0
            }))
            .sort((a, b) => b.year - a.year);

          // Watch type distribution
          const watchTypeCounts = {};
          watches.forEach(watch => {
            watchTypeCounts[watch.watchType] = (watchTypeCounts[watch.watchType] || 0) + 1;
          });

          const watchTypeDistribution: WatchTypeDistribution[] = Object.entries(watchTypeCounts)
            .map(([type, count]) => ({
              type,
              count: count as number,
              percentage: totalWatch ? (count as number) / totalWatch * 100 : 0
            }));

          // Monthly watch counts
          const monthlyData = {};
          watches.forEach(watch => {
            const date = new Date(watch.watchedAt);
            const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthlyData[yearMonth] = (monthlyData[yearMonth] || 0) + 1;
          });

          const monthlyWatchCounts: MonthlyWatchCount[] = Object.entries(monthlyData)
            .map(([yearMonth, count]) => {
              const [year, month] = yearMonth.split('-');
              return {
                year: parseInt(year),
                month,
                count: count as number
              };
            })
            .sort((a, b) => {
              if (a.year !== b.year) return a.year - b.year;
              return parseInt(a.month) - parseInt(b.month);
            });

          return {
            totalWatch,
            uniqueMovies: uniqueMovieIds,
            totalWatchTime,
            averageRating,
            averageMoodRating,
            totalRewatches,
            averageWatchesPerMovie,
            firstWatchDate,
            lastWatchDate,
            favoriteCount,
            totalDays,
            genreDistribution,
            yearDistribution,
            watchTypeDistribution,
            monthlyWatchCounts
          };
        } catch (error) {
          this.logger.error(`Error calculating watch stats for user ${userId}: ${error.message}`, error.stack);
          throw error;
        }
      },
      3600 // Cache for 1 hour
    );
  }

  async getDetailedMovieWatchStats(movieId: string, userId: string): Promise<any> {
    try {
      const cacheKey = this.cacheKeyFactory.generate('watchHistory', 'movieStats', [movieId, userId]);
      
      return this.cacheService.getOrFetch(
        cacheKey,
        async () => {
          // Get all watch history entries for this movie and user
          const watches = await this.watchHistoryRepository.find({
            where: { movieId, userId },
            order: { watchedAt: 'ASC' }
          });

          if (watches.length === 0) {
            return {
              watchCount: 0,
              firstWatchDate: null,
              lastWatchDate: null,
              averageRating: 0,
              isFavorite: false
            };
          }

          // Calculate stats
          const watchCount = watches.length;
          const firstWatchDate = watches[0].watchedAt;
          const lastWatchDate = watches[watches.length - 1].watchedAt;
          
          // Get average rating across all watches
          const watchesWithRating = watches.filter(w => w.rating !== null && w.rating !== undefined);
          const averageRating = watchesWithRating.length 
            ? watchesWithRating.reduce((sum, w) => sum + (w.rating || 0), 0) / watchesWithRating.length 
            : 0;

          // Get the latest watch entry to determine if it's favorited
          const latestWatch = watches[watches.length - 1];
          const isFavorite = latestWatch.isFavorite || false;

          // Calculate time between watches
          const watchIntervals: number[] = [];
          for (let i = 1; i < watches.length; i++) {
            const currentDate = new Date(watches[i].watchedAt);
            const previousDate = new Date(watches[i-1].watchedAt);
            const daysBetween = Math.ceil((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));
            watchIntervals.push(daysBetween);
          }

          const averageInterval = watchIntervals.length 
            ? watchIntervals.reduce((sum, days) => sum + days, 0) / watchIntervals.length
            : 0;

          return {
            watchCount,
            firstWatchDate,
            lastWatchDate,
            averageRating,
            isFavorite,
            watches,
            averageInterval,
            watchIntervals
          };
        },
        1800 // Cache for 30 minutes
      );
    } catch (error) {
      this.logger.error(`Error getting movie watch stats for movie ${movieId} and user ${userId}: ${error.message}`, error.stack);
      return {
        watchCount: 0,
        firstWatchDate: null,
        lastWatchDate: null,
        averageRating: 0,
        isFavorite: false
      };
    }
  }

  async toggleFavorite(watchId: string, userId: string): Promise<WatchHistory> {
    try {
      // Find the watch entry
      const watch = await this.watchHistoryRepository.findOne({
        where: { id: watchId }
      });

      if (!watch) {
        throw new NotFoundException(`Watch history entry with ID ${watchId} not found`);
      }

      if (watch.userId !== userId) {
        throw new ForbiddenException('You do not have permission to update this watch history entry');
      }

      // Toggle the favorite status
      watch.isFavorite = !watch.isFavorite;
      
      const saved = await this.watchHistoryRepository.save(watch);
      
      // Clear caches
      await this.clearEntityCache(watchId);
      await this.clearUserWatchStatsCache(userId);
      
      // Also clear movie-user specific caches
      const movieId = watch.movieId;
      await this.cacheService.invalidate(
        this.cacheKeyFactory.generate('watchHistory', 'movieUser', [movieId, userId])
      );
      await this.cacheService.invalidate(
        this.cacheKeyFactory.generate('watchHistory', 'allMovieUser', [movieId, userId])
      );
      
      return saved;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      
      this.logger.error(`Error toggling favorite for watch ${watchId}: ${error.message}`, error.stack);
      throw new Error(`Failed to toggle favorite for watch history entry: ${error.message}`);
    }
  }

  async addBulkWatches(tmdbIds: number[], date: Date, userId: string): Promise<WatchHistory[]> {
    try {
      const watches: WatchHistory[] = [];

      for (const tmdbId of tmdbIds) {
        // Find or create movie by TMDB ID
        let movie = await this.movieRepository.findOne({
          where: { tmdbId }
        });
        
        if (!movie) {
          // If we can't find the movie, we can't create a watch history entry
          this.logger.warn(`Skipping bulk watch creation for TMDB ID ${tmdbId} - movie not found`);
          continue;
        }
        
        // Create watch with the movie entity
        const watch = await this.create({
          userId,
          watchedAt: date,
          watchType: WatchType.FIRST_TIME,
          tmdbId, // This is for consistency in inputs but won't be used directly
          movieEntity: movie // This will be used for the relationship
        });
        
        watches.push(watch);
      }

      await this.clearUserWatchStatsCache(userId);
      return watches;
    } catch (error) {
      this.logger.error(`Error adding bulk watches for user ${userId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getWatchStreak(userId: string): Promise<{ currentStreak: number, longestStreak: number }> {
    try {
      const cacheKey = this.cacheKeyFactory.generate('watchHistory', 'streak', [userId]);
      
      return this.cacheService.getOrFetch(
        cacheKey,
        async () => {
          // Get all watch history entries ordered by date
          const watches = await this.watchHistoryRepository.find({
            where: { userId },
            order: { watchedAt: 'ASC' }
          });

          if (watches.length === 0) {
            return { currentStreak: 0, longestStreak: 0 };
          }

          // Group watches by day
          const watchDays = new Set<string>();
          watches.forEach(watch => {
            const date = new Date(watch.watchedAt);
            const dateString = date.toISOString().split('T')[0];
            watchDays.add(dateString);
          });

          const sortedDays = Array.from(watchDays).sort();
          
          // Calculate streaks
          let longestStreak = 1;
          let currentStreak = 1;
          let currentStreakEnd = true;

          for (let i = 1; i < sortedDays.length; i++) {
            const currentDate = new Date(sortedDays[i]);
            const prevDate = new Date(sortedDays[i-1]);
            
            // Check if dates are consecutive
            const timeDiff = currentDate.getTime() - prevDate.getTime();
            const dayDiff = timeDiff / (1000 * 3600 * 24);
            
            if (dayDiff === 1) {
              // Consecutive day
              currentStreak++;
              if (i === sortedDays.length - 1) {
                currentStreakEnd = false;
              }
            } else {
              // Streak broken
              longestStreak = Math.max(longestStreak, currentStreak);
              currentStreak = 1;
              if (i === sortedDays.length - 1) {
                currentStreakEnd = false;
              }
            }
          }

          longestStreak = Math.max(longestStreak, currentStreak);
          
          // If the current streak doesn't end with today or yesterday, it's broken
          if (currentStreakEnd) {
            const lastWatchDate = new Date(sortedDays[sortedDays.length - 1]);
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            
            if (lastWatchDate.toISOString().split('T')[0] !== today.toISOString().split('T')[0] &&
                lastWatchDate.toISOString().split('T')[0] !== yesterday.toISOString().split('T')[0]) {
              currentStreak = 0;
            }
          }

          return { currentStreak, longestStreak };
        },
        1800 // Cache for 30 minutes
      );
    } catch (error) {
      this.logger.error(`Error calculating watch streak for user ${userId}: ${error.message}`, error.stack);
      return { currentStreak: 0, longestStreak: 0 };
    }
  }

  async clearUserWatchStatsCache(userId: string): Promise<void> {
    try {
      // Clear user stats
      await this.cacheService.invalidate(
        this.cacheKeyFactory.generate('user', 'watchStats', [userId])
      );
      
      // Clear user watch history
      await this.cacheService.invalidatePattern(
        this.cacheKeyFactory.generate('watchHistory', 'userHistory', [userId])
      );
      
      // Clear streak data
      await this.cacheService.invalidate(
        this.cacheKeyFactory.generate('watchHistory', 'streak', [userId])
      );
    } catch (error) {
      this.logger.error(`Error clearing user watch stats cache for user ${userId}: ${error.message}`, error.stack);
    }
  }

  async getUserWatchStats(userId: string): Promise<WatchHistoryStats> {
    return this.getStats(userId);
  }
}