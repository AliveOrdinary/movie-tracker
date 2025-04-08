// src/modules/users/service/user-stats.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { WatchHistory } from '../../watch-history/entities/watch-history.entity';
import { Review } from '../../reviews/entities/review.entity';
import { List } from '../../lists/entities/list.entity';
import { UserFollow } from '../../social/entities/user-follow.entity';
import { UserStats, GenreDistribution, YearlyWatchStats } from '../dto/user-stats.dto';
import { CacheService } from '../../../common/services/cache.service';

@Injectable()
export class UserStatsService {
  private readonly logger = new Logger(UserStatsService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(WatchHistory)
    private watchHistoryRepository: Repository<WatchHistory>,
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(List)
    private listRepository: Repository<List>,
    @InjectRepository(UserFollow)
    private userFollowRepository: Repository<UserFollow>,
    private readonly cacheService: CacheService,
  ) {}

  async getUserStats(userId: string): Promise<UserStats> {
    const cacheKey = `user:stats:${userId}`;
    
    try {
      return this.cacheService.getOrFetch(
        cacheKey,
        async () => {
          try {
            // Get watch history with movie details
            const watches = await this.watchHistoryRepository.find({
              where: { userId },
              relations: ['movie'],
            });

            // Initialize defaults for empty results
            if (!watches || watches.length === 0) {
              return {
                totalWatched: 0,
                totalReviews: 0,
                averageRating: 0,
                totalLists: 0,
                totalFollowers: 0,
                totalFollowing: 0,
                watchTimeMinutes: 0,
                watchesPerMonth: 0,
                favoritesCount: 0,
                genreDistribution: [],
                yearlyWatchStats: []
              };
            }

            // Calculate basic stats
            const totalWatched = watches.length;
            const uniqueMoviesCount = new Set(watches.map(w => w.movieId)).size;

            const watchTimeMinutes = watches.reduce((sum, w) => {
              if (w.movie && w.movie.runtime) {
                return sum + w.movie.runtime;
              }
              return sum;
            }, 0);

            // Calculate genre distribution
            const genreCounts = {};
            let totalGenreCounts = 0;

            watches.forEach(watch => {
              if (watch.movie && watch.movie.genres) {
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
                percentage: totalGenreCounts ? ((count as number) / totalGenreCounts) * 100 : 0
              }))
              .sort((a, b) => b.count - a.count);

            // Calculate yearly watch stats
            const yearCounts = {};
            watches.forEach(watch => {
              if (watch.watchedAt) {
                const year = new Date(watch.watchedAt).getFullYear();
                yearCounts[year] = (yearCounts[year] || 0) + 1;
              }
            });

            const yearlyWatchStats: YearlyWatchStats[] = Object.entries(yearCounts)
              .map(([year, count]) => ({
                year: parseInt(year),
                count: count as number
              }))
              .sort((a, b) => b.year - a.year);

            // Get other user stats with error handling
            let reviewsCount = 0;
            let listsCount = 0;
            let followersCount = 0;
            let followingCount = 0;
            let favoritesCount = 0;
            let averageRating = 0;

            try {
              reviewsCount = await this.reviewRepository.count({ 
                where: { user: { id: userId } }
              });
            } catch (error) {
              this.logger.error(`Error getting reviews count: ${error.message}`);
            }

            try {
              listsCount = await this.listRepository.count({ where: { owner_id: userId } });
            } catch (error) {
              this.logger.error(`Error getting lists count: ${error.message}`);
            }

            try {
              followersCount = await this.userFollowRepository.count({ where: { following_id: userId } });
            } catch (error) {
              this.logger.error(`Error getting followers count: ${error.message}`);
            }

            try {
              followingCount = await this.userFollowRepository.count({ where: { follower_id: userId } });
            } catch (error) {
              this.logger.error(`Error getting following count: ${error.message}`);
            }

            try {
              favoritesCount = await this.listRepository.createQueryBuilder('list')
                .innerJoinAndSelect('list.favorites', 'favorites')
                .where('favorites.userId = :userId', { userId })
                .getCount();
            } catch (error) {
              this.logger.error(`Error getting favorites count: ${error.message}`);
            }

            try {
              const ratingResult = await this.reviewRepository
                .createQueryBuilder('review')
                .where('review.user_id = :userId', { userId })
                .select('AVG(review.rating)', 'avg')
                .getRawOne();

              averageRating = parseFloat(ratingResult?.avg || '0');
              // Ensure we have a valid number
              if (isNaN(averageRating)) {
                averageRating = 0;
              }
            } catch (error) {
              this.logger.error(`Error getting average rating: ${error.message}`);
            }

            // Calculate watches per month
            let watchesPerMonth = 0;
            try {
              const userCreatedAt = await this.userRepository
                .createQueryBuilder('user')
                .select('user.createdAt')
                .where('user.id = :userId', { userId })
                .getRawOne();

              const creationDate = new Date(userCreatedAt?.user_createdAt || new Date());
              const now = new Date();
              const monthsSinceCreation = Math.max(1, 
                (now.getFullYear() - creationDate.getFullYear()) * 12 + 
                (now.getMonth() - creationDate.getMonth())
              ); // Ensure at least 1 month to avoid division by zero

              watchesPerMonth = totalWatched / monthsSinceCreation;
            } catch (error) {
              this.logger.error(`Error calculating watches per month: ${error.message}`);
            }

            return {
              totalWatched,
              totalReviews: reviewsCount,
              averageRating,
              totalLists: listsCount,
              totalFollowers: followersCount,
              totalFollowing: followingCount,
              watchTimeMinutes,
              watchesPerMonth,
              favoritesCount,
              genreDistribution,
              yearlyWatchStats
            };
          } catch (error) {
            this.logger.error(`Error generating user stats for ${userId}: ${error.message}`, error.stack);
            // Return default empty stats on error
            return {
              totalWatched: 0,
              totalReviews: 0,
              averageRating: 0,
              totalLists: 0,
              totalFollowers: 0,
              totalFollowing: 0,
              watchTimeMinutes: 0,
              watchesPerMonth: 0,
              favoritesCount: 0,
              genreDistribution: [],
              yearlyWatchStats: []
            };
          }
        },
        3600 // 1 hour cache
      );
    } catch (error) {
      this.logger.error(`Error retrieving or generating user stats from cache for ${userId}: ${error.message}`, error.stack);
      // If even the cache mechanism fails, return empty data
      return {
        totalWatched: 0,
        totalReviews: 0,
        averageRating: 0,
        totalLists: 0,
        totalFollowers: 0,
        totalFollowing: 0,
        watchTimeMinutes: 0,
        watchesPerMonth: 0,
        favoritesCount: 0,
        genreDistribution: [],
        yearlyWatchStats: []
      };
    }
  }

  // This method should be called when relevant data changes to invalidate the cache
  async invalidateUserStats(userId: string): Promise<void> {
    try {
      await this.cacheService.invalidate(`user:stats:${userId}`);
    } catch (error) {
      this.logger.error(`Error invalidating stats cache for user ${userId}: ${error.message}`, error.stack);
    }
  }
}