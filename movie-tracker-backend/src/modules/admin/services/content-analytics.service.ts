// src/modules/admin/services/content-analytics.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan, LessThan } from 'typeorm';
import { Review } from '../../reviews/entities/review.entity';
import { List } from '../../lists/entities/list.entity';
import { Movie } from '../../movies/entities/movie.entity';
import { WatchHistory } from '../../watch-history/entities/watch-history.entity';
import { User } from '../../users/entities/user.entity';
import { CacheService } from '../../../common/services/cache.service';
import { CacheKeyFactory } from '../../../common/factories/cache-key.factory';
import { EntityCacheTTL } from '../../../common/constants/cache-ttl.constants';
import { ReviewStatus, WatchType } from '../../../common/enums';

@Injectable()
export class ContentAnalyticsService {
  private readonly logger = new Logger(ContentAnalyticsService.name);

  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(List)
    private listRepository: Repository<List>,
    @InjectRepository(Movie)
    private movieRepository: Repository<Movie>,
    @InjectRepository(WatchHistory)
    private watchHistoryRepository: Repository<WatchHistory>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly cacheService: CacheService,
    protected readonly cacheKeyFactory: CacheKeyFactory
  ) {}

  /**
   * Get trending data across the platform
   */
  async getTrendingData(days = 7): Promise<any> {
    const cacheKey = this.cacheKeyFactory.generate('admin', 'trending', [days.toString()]);
    return this.cacheService.getOrFetch(
      cacheKey,
      async () => {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const [trendingMovies, trendingGenres, popularLists, activeUsers] = await Promise.all([
          this.getTrendingMovies(startDate),
          this.getTrendingGenres(startDate),
          this.getPopularLists(startDate),
          this.getMostActiveUsers(startDate)
        ]);

        return {
          trendingMovies,
          trendingGenres,
          popularLists,
          activeUsers
        };
      },
      EntityCacheTTL.ADMIN_TRENDING
    );
  }

  /**
   * Get content creation metrics by time periods
   */
  async getContentCreationMetrics(): Promise<any> {
    const cacheKey = this.cacheKeyFactory.generate('admin', 'content', ['creation-metrics']);
    return this.cacheService.getOrFetch(
      cacheKey,
      async () => {
        // Get date ranges
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const lastWeekStart = new Date(today);
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);
        
        const lastMonthStart = new Date(today);
        lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);

        // Get content creation metrics
        const [
          // Reviews
          reviewsToday,
          reviewsYesterday,
          reviewsLastWeek,
          reviewsLastMonth,
          pendingReviews,
          flaggedReviews,
          // Lists
          listsToday,
          listsYesterday,
          listsLastWeek,
          listsLastMonth,
          // Watches
          watchesToday,
          watchesYesterday,
          watchesLastWeek,
          watchesLastMonth,
          rewatchCount
        ] = await Promise.all([
          // Reviews
          this.reviewRepository.count({ where: { createdAt: MoreThan(today) } }),
          this.reviewRepository.count({ where: { createdAt: Between(yesterday, today) } }),
          this.reviewRepository.count({ where: { createdAt: Between(lastWeekStart, now) } }),
          this.reviewRepository.count({ where: { createdAt: Between(lastMonthStart, now) } }),
          this.reviewRepository.count({ where: { status: ReviewStatus.PENDING } }),
          this.reviewRepository.count({ where: { isFlagged: true } }),
          
          // Lists
          this.listRepository.count({ where: { createdAt: MoreThan(today) } }),
          this.listRepository.count({ where: { createdAt: Between(yesterday, today) } }),
          this.listRepository.count({ where: { createdAt: Between(lastWeekStart, now) } }),
          this.listRepository.count({ where: { createdAt: Between(lastMonthStart, now) } }),
          
          // Watches
          this.watchHistoryRepository.count({ where: { createdAt: MoreThan(today) } }),
          this.watchHistoryRepository.count({ where: { createdAt: Between(yesterday, today) } }),
          this.watchHistoryRepository.count({ where: { createdAt: Between(lastWeekStart, now) } }),
          this.watchHistoryRepository.count({ where: { createdAt: Between(lastMonthStart, now) } }),
          this.watchHistoryRepository.count({ where: { watchType: WatchType.REWATCH } })
        ]);

        return {
          reviews: {
            today: reviewsToday,
            yesterday: reviewsYesterday,
            lastWeek: reviewsLastWeek,
            lastMonth: reviewsLastMonth,
            pending: pendingReviews,
            flagged: flaggedReviews
          },
          lists: {
            today: listsToday,
            yesterday: listsYesterday,
            lastWeek: listsLastWeek,
            lastMonth: listsLastMonth
          },
          watches: {
            today: watchesToday,
            yesterday: watchesYesterday,
            lastWeek: watchesLastWeek,
            lastMonth: watchesLastMonth,
            rewatches: rewatchCount
          }
        };
      },
      EntityCacheTTL.ADMIN_CONTENT_STATS
    );
  }

  /**
   * Get review metrics by rating
   */
  async getReviewRatingDistribution(): Promise<{ rating: number; count: number; percentage: number }[]> {
    const cacheKey = this.cacheKeyFactory.generate('admin', 'reviews', ['rating-distribution']);
    return this.cacheService.getOrFetch(
      cacheKey,
      async () => {
        const distribution: { rating: number; count: number; percentage: number }[] = [];
        const totalReviews = await this.reviewRepository.count();
        
        // Get count for each rating (1-5)
        for (let rating = 1; rating <= 5; rating++) {
          const count = await this.reviewRepository.count({
            where: { rating }
          });
          
          distribution.push({
            rating,
            count,
            percentage: Math.round((count / totalReviews) * 1000) / 10 // Round to 1 decimal place
          });
        }
        
        return distribution;
      },
      EntityCacheTTL.MEDIUM // Use standard TTL constant
    );
  }

  /**
   * Get watch statistics
   */
  async getWatchStatistics(): Promise<any> {
    const cacheKey = this.cacheKeyFactory.generate('admin', 'watch', ['statistics']);
    return this.cacheService.getOrFetch(
      cacheKey,
      async () => {
        const totalWatches = await this.watchHistoryRepository.count();
        const uniqueMovies = await this.watchHistoryRepository
          .createQueryBuilder('watch')
          .select('COUNT(DISTINCT watch.movieId)', 'count')
          .getRawOne()
          .then(result => parseInt(result.count));
        
        const uniqueUsers = await this.watchHistoryRepository
          .createQueryBuilder('watch')
          .select('COUNT(DISTINCT watch.userId)', 'count')
          .getRawOne()
          .then(result => parseInt(result.count));
        
        // Get watch type distribution
        const firstTimeWatches = await this.watchHistoryRepository.count({
          where: { watchType: WatchType.FIRST_TIME }
        });
        
        const rewatches = await this.watchHistoryRepository.count({
          where: { watchType: WatchType.REWATCH }
        });
        
        const partialWatches = await this.watchHistoryRepository.count({
          where: { watchType: WatchType.PARTIAL }
        });

        // Monthly watch trends for the past 12 months
        const monthlyTrends = await this.getMonthlyWatchTrends();

        return {
          totalWatches,
          uniqueMovies,
          uniqueUsers,
          watchTypes: {
            firstTime: firstTimeWatches,
            rewatch: rewatches,
            partial: partialWatches
          },
          averageWatchesPerUser: uniqueUsers ? Math.round((totalWatches / uniqueUsers) * 10) / 10 : 0,
          averageWatchesPerMovie: uniqueMovies ? Math.round((totalWatches / uniqueMovies) * 10) / 10 : 0,
          monthlyTrends
        };
      },
      EntityCacheTTL.MEDIUM // Use standard TTL constant
    );
  }

  /**
   * Get monthly watch trends for the past 12 months
   */
  private async getMonthlyWatchTrends(): Promise<{ month: string; year: number; count: number }[]> {
    const results: { month: string; year: number; count: number }[] = [];
    const now = new Date();
    
    // Generate last 12 months
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      
      const count = await this.watchHistoryRepository.count({
        where: { createdAt: Between(startDate, endDate) }
      });
      
      results.push({
        month: month.toString().padStart(2, '0'),
        year,
        count
      });
    }
    
    // Reverse to get chronological order
    return results.reverse();
  }

  /**
   * Get trending movies based on recent watches and reviews
   */
  private async getTrendingMovies(startDate: Date): Promise<any[]> {
    // Get most watched movies in the period
    const watchedMovies = await this.watchHistoryRepository
      .createQueryBuilder('watch')
      .select('watch.movieId', 'movieId')
      .addSelect('COUNT(watch.id)', 'watchCount')
      .where('watch.createdAt >= :startDate', { startDate })
      .groupBy('watch.movieId')
      .orderBy('watchCount', 'DESC')
      .limit(10)
      .getRawMany();
    
    // Get most reviewed movies in the period
    const reviewedMovies = await this.reviewRepository
      .createQueryBuilder('review')
      .select('review.movieId', 'movieId')
      .addSelect('COUNT(review.id)', 'reviewCount')
      .where('review.createdAt >= :startDate', { startDate })
      .groupBy('review.movieId')
      .orderBy('reviewCount', 'DESC')
      .limit(10)
      .getRawMany();
    
    // Combine and weight the results
    const movieScores = new Map();
    
    watchedMovies.forEach(({ movieId, watchCount }) => {
      movieScores.set(movieId, { 
        id: movieId,
        watchCount: parseInt(watchCount),
        reviewCount: 0,
        score: parseInt(watchCount) * 1 // Weight for watches
      });
    });
    
    reviewedMovies.forEach(({ movieId, reviewCount }) => {
      if (movieScores.has(movieId)) {
        const current = movieScores.get(movieId);
        current.reviewCount = parseInt(reviewCount);
        current.score += parseInt(reviewCount) * 2; // Weight for reviews
        movieScores.set(movieId, current);
      } else {
        movieScores.set(movieId, {
          id: movieId,
          watchCount: 0,
          reviewCount: parseInt(reviewCount),
          score: parseInt(reviewCount) * 2 // Weight for reviews
        });
      }
    });
    
    // Sort by score and get top 10
    const topMovieIds: string[] = [...movieScores.entries()]
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 10)
    .map(([id]) => id);
    
    // Get full movie details
    const movies = await this.movieRepository.findByIds(topMovieIds);
    
    // Return with score details
    return topMovieIds.map(id => {
      const movie = movies.find(m => m.id === id);
      const stats = movieScores.get(id);
      
      return {
        ...movie,
        trendingStats: {
          watchCount: stats.watchCount,
          reviewCount: stats.reviewCount,
          trendingScore: stats.score
        }
      };
    });
  }

  /**
   * Get trending genres based on watches and reviews
   */
  private async getTrendingGenres(startDate: Date): Promise<{ genre: string; count: number; percentage: number }[]> {
    // Get movies watched in the period
    const watches = await this.watchHistoryRepository.find({
      where: { createdAt: MoreThan(startDate) },
      relations: ['movie']
    });
    
    // Count genres
    const genreCounts = {};
    let totalGenreMentions = 0;
    
    watches.forEach(watch => {
      if (watch.movie?.genres) {
        watch.movie.genres.forEach(genre => {
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
          totalGenreMentions++;
        });
      }
    });
    
    // Convert to array with percentages
    return Object.entries(genreCounts)
      .map(([genre, count]) => ({
        genre,
        count: count as number,
        percentage: totalGenreMentions ? Math.round((count as number) / totalGenreMentions * 1000) / 10 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Get popular lists in the given period
   */
  private async getPopularLists(startDate: Date): Promise<any[]> {
    return this.listRepository.find({
      where: { createdAt: MoreThan(startDate) },
      order: { favoriteCount: 'DESC' },
      take: 10
    });
  }

  /**
   * Get user registration trends over time
   * @param timeframe The timeframe to analyze (day, week, month)
   * @param period The number of periods to include
   */
  async getUserRegistrationTrends(timeframe: 'day' | 'week' | 'month', period: number): Promise<any> {
    const cacheKey = this.cacheKeyFactory.generate('admin', 'trends', ['registrations', timeframe, period.toString()]);
    return this.cacheService.getOrFetch(
      cacheKey,
      async () => {
        const now = new Date();
        const series: number[] = [];
        const labels: string[] = [];
        
        for (let i = 0; i < period; i++) {
          let startDate: Date, endDate: Date;
          
          if (timeframe === 'day') {
            startDate = new Date(now);
            startDate.setDate(startDate.getDate() - i);
            startDate.setHours(0, 0, 0, 0);
            
            endDate = new Date(startDate);
            endDate.setHours(23, 59, 59, 999);

            const label = `${startDate.getMonth() + 1}/${startDate.getDate()}`;
            labels.push(label.toString());
          } else if (timeframe === 'week') {
            endDate = new Date(now);
            endDate.setDate(endDate.getDate() - (i * 7));
            
            startDate = new Date(endDate);
            startDate.setDate(startDate.getDate() - 6);
            startDate.setHours(0, 0, 0, 0);
            
            endDate.setHours(23, 59, 59, 999);

            const label = `${startDate.getMonth() + 1}/${startDate.getDate()} - ${endDate.getMonth() + 1}/${endDate.getDate()}`;
            labels.push(label.toString());
          } else { // month
            startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);

            const label = `${startDate.toLocaleString('default', { month: 'short' })} ${startDate.getFullYear()}`;
            labels.push(label.toString());
          }
          
          const count = await this.userRepository.count({
            where: { createdAt: Between(startDate, endDate) }
          });
          
          series.push(count);
        }
        
        return {
          labels,
          series,
          timeframe,
          period
        };
      },
      EntityCacheTTL.MEDIUM // Use standard TTL constant
    );
  }

  /**
   * Get review creation trends over time
   * @param timeframe The timeframe to analyze (day, week, month)
   * @param period The number of periods to include
   */
  async getReviewTrends(timeframe: 'day' | 'week' | 'month', period: number): Promise<any> {
    const cacheKey = this.cacheKeyFactory.generate('admin', 'trends', ['reviews', timeframe, period.toString()]);
    return this.cacheService.getOrFetch(
      cacheKey,
      async () => {
        const now = new Date();
        const series: number[] = [];
        const labels: string[] = [];
        
        for (let i = 0; i < period; i++) {
          let startDate: Date, endDate: Date;
          
          if (timeframe === 'day') {
            startDate = new Date(now);
            startDate.setDate(startDate.getDate() - i);
            startDate.setHours(0, 0, 0, 0);
            
            endDate = new Date(startDate);
            endDate.setHours(23, 59, 59, 999);

            const label = `${startDate.getMonth() + 1}/${startDate.getDate()}`;
            labels.push(label.toString());
          } else if (timeframe === 'week') {
            endDate = new Date(now);
            endDate.setDate(endDate.getDate() - (i * 7));
            
            startDate = new Date(endDate);
            startDate.setDate(startDate.getDate() - 6);
            startDate.setHours(0, 0, 0, 0);
            
            endDate.setHours(23, 59, 59, 999);

            const label = `${startDate.getMonth() + 1}/${startDate.getDate()} - ${endDate.getMonth() + 1}/${endDate.getDate()}`;
            labels.push(label.toString());
          } else { // month
            startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);

            const label = `${startDate.toLocaleString('default', { month: 'short' })} ${startDate.getFullYear()}`;
            labels.push(label.toString());
          }
          
          const count = await this.reviewRepository.count({
            where: { createdAt: Between(startDate, endDate) }
          });
          
          series.push(count);
        }
        
        return {
          labels,
          series,
          timeframe,
          period
        };
      },
      EntityCacheTTL.MEDIUM // Use standard TTL constant
    );
  }

  /**
   * Get watch activity trends over time
   * @param timeframe The timeframe to analyze (day, week, month)
   * @param period The number of periods to include
   */
  async getWatchActivityTrends(timeframe: 'day' | 'week' | 'month', period: number): Promise<any> {
    const cacheKey = this.cacheKeyFactory.generate('admin', 'trends', ['watches', timeframe, period.toString()]);
    return this.cacheService.getOrFetch(
      cacheKey,
      async () => {
        const now = new Date();
        const series: number[] = [];
        const labels: string[] = [];
        
        for (let i = 0; i < period; i++) {
          let startDate: Date, endDate: Date;
          
          if (timeframe === 'day') {
            startDate = new Date(now);
            startDate.setDate(startDate.getDate() - i);
            startDate.setHours(0, 0, 0, 0);
            
            endDate = new Date(startDate);
            endDate.setHours(23, 59, 59, 999);

            const label = `${startDate.getMonth() + 1}/${startDate.getDate()}`;
            labels.push(label.toString());
          } else if (timeframe === 'week') {
            endDate = new Date(now);
            endDate.setDate(endDate.getDate() - (i * 7));
            
            startDate = new Date(endDate);
            startDate.setDate(startDate.getDate() - 6);
            startDate.setHours(0, 0, 0, 0);
            
            endDate.setHours(23, 59, 59, 999);

            const label = `${startDate.getMonth() + 1}/${startDate.getDate()} - ${endDate.getMonth() + 1}/${endDate.getDate()}`;
            labels.push(label.toString());
          } else { // month
            startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);

            const label = `${startDate.toLocaleString('default', { month: 'short' })} ${startDate.getFullYear()}`;
            labels.push(label.toString());
          }
          
          const count = await this.watchHistoryRepository.count({
            where: { createdAt: Between(startDate, endDate) }
          });
          
          series.push(count);
        }
        
        return {
          labels,
          series,
          timeframe,
          period
        };
      },
      EntityCacheTTL.MEDIUM // Use standard TTL constant
    );
  }







  /**
   * Get genre analytics for admin dashboard
   */
  async getGenreAnalytics(): Promise<any[]> {
    const cacheKey = this.cacheKeyFactory.generate('admin', 'content', ['genre-analytics']);
    
    return this.cacheService.getOrFetch(
      cacheKey,
      async () => {
        // Get all watches with movie relationships
        const watches = await this.watchHistoryRepository.find({
          relations: ['movie']
        });
        
        // Count genres and calculate statistics
        const genreCounts = {};
        let totalGenreEntries = 0;
        
        watches.forEach(watch => {
          if (watch.movie?.genres) {
            watch.movie.genres.forEach(genre => {
              genreCounts[genre] = (genreCounts[genre] || 0) + 1;
              totalGenreEntries++;
            });
          }
        });
        
        // Get recent watches for growth calculation
        const lastMonthDate = new Date();
        lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
        
        const recentWatches = await this.watchHistoryRepository.find({
          where: { createdAt: MoreThan(lastMonthDate) },
          relations: ['movie']
        });
        
        // Calculate recent genre counts for growth metric
        const recentGenreCounts = {};
        recentWatches.forEach(watch => {
          if (watch.movie?.genres) {
            watch.movie.genres.forEach(genre => {
              recentGenreCounts[genre] = (recentGenreCounts[genre] || 0) + 1;
            });
          }
        });
        
        // Calculate growth and percentages
        return Object.entries(genreCounts)
          .map(([genre, count]) => {
            const recentCount = recentGenreCounts[genre] || 0;
            const totalGenreCount = count as number;
            const percentage = totalGenreEntries > 0 ? (totalGenreCount / totalGenreEntries) * 100 : 0;
            
            // Estimate growth by comparing recent activity to overall
            const averageCountPerMonth = totalGenreCount / 12; // Assuming data spans a year on average
            const growth = averageCountPerMonth > 0 ? ((recentCount / averageCountPerMonth) - 1) * 100 : 0;
            
            return {
              genre,
              count: totalGenreCount,
              percentage: Math.round(percentage * 10) / 10, // Round to 1 decimal
              growth: Math.round(growth)
            };
          })
          .sort((a, b) => b.count - a.count);
      },
      3600 // 1 hour cache
    );
  }

  /**
   * Get list creation statistics over time
   */
  async getListCreationStats(): Promise<any> {
    const cacheKey = this.cacheKeyFactory.generate('admin', 'content', ['list-creation-stats']);
    
    return this.cacheService.getOrFetch(
      cacheKey,
      async () => {
        const now = new Date();
        const labels: string[] = [];
        const series: number[] = [];
        
        // Get list creation stats by month for the past 12 months
        for (let i = 0; i < 12; i++) {
          const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
          
          const count = await this.listRepository.count({
            where: { createdAt: Between(startDate, endDate) }
          });
          
          const label = startDate.toLocaleString('default', { month: 'short', year: 'numeric' });
          labels.push(label.toString());
          series.push(count);
        }
        
        return {
          labels,
          series,
          timeframe: 'month',
          period: 12
        };
      },
      3600 // 1 hour cache
    );
  }

  /**
   * Get popular content analytics
   */
  async getPopularContentAnalytics(limit: number = 10): Promise<any> {
    const cacheKey = this.cacheKeyFactory.generate('admin', 'content', ['popular-analytics', limit.toString()]);
    
    return this.cacheService.getOrFetch(
      cacheKey,
      async () => {
        // Get most watched movies
        const watchedMoviesQuery = this.watchHistoryRepository
          .createQueryBuilder('watch')
          .select('watch.movieId', 'movieId')
          .addSelect('COUNT(watch.id)', 'watchCount')
          .groupBy('watch.movieId')
          .orderBy('watchCount', 'DESC')
          .limit(limit);

        const watchedMovies = await watchedMoviesQuery.getRawMany();

        // Get most reviewed movies
        const reviewedMoviesQuery = this.reviewRepository
          .createQueryBuilder('review')
          .select('review.movieId', 'movieId')
          .addSelect('COUNT(review.id)', 'reviewCount')
          .groupBy('review.movieId')
          .orderBy('reviewCount', 'DESC')
          .limit(limit);

        const reviewedMovies = await reviewedMoviesQuery.getRawMany();

        // Get most favorited lists
        const popularListsQuery = this.listRepository
          .createQueryBuilder('list')
          .orderBy('list.favoriteCount', 'DESC')
          .limit(limit);

        const popularLists = await popularListsQuery.getMany();
        
        return {
          mostWatchedMovies: watchedMovies,
          mostReviewedMovies: reviewedMovies,
          popularLists: popularLists.map(list => ({
            id: list.id,
            name: list.name,
            favoriteCount: list.favoriteCount
          }))
        };
      },
      EntityCacheTTL.MEDIUM // Use standard TTL constant
    );
  }
  
  /**
   * Get most active users in the given period
   */
  private async getMostActiveUsers(startDate: Date): Promise<any[]> {
    // Get users with most watch history entries
    const activeWatchers = await this.watchHistoryRepository
      .createQueryBuilder('watch')
      .select('watch.userId', 'userId')
      .addSelect('COUNT(watch.id)', 'watchCount')
      .where('watch.createdAt >= :startDate', { startDate })
      .groupBy('watch.userId')
      .orderBy('watchCount', 'DESC')
      .limit(10)
      .getRawMany();
    
    // Get users with most reviews
    const activeReviewers = await this.reviewRepository
      .createQueryBuilder('review')
      .select('review.userId', 'userId')
      .addSelect('COUNT(review.id)', 'reviewCount')
      .where('review.createdAt >= :startDate', { startDate })
      .groupBy('review.userId')
      .orderBy('reviewCount', 'DESC')
      .limit(10)
      .getRawMany();
    
    // Combine and score
    const userScores = new Map();
    
    activeWatchers.forEach(({ userId, watchCount }) => {
      userScores.set(userId, {
        id: userId,
        watchCount: parseInt(watchCount),
        reviewCount: 0,
        activityScore: parseInt(watchCount)
      });
    });
    
    activeReviewers.forEach(({ userId, reviewCount }) => {
      if (userScores.has(userId)) {
        const current = userScores.get(userId);
        current.reviewCount = parseInt(reviewCount);
        current.activityScore += parseInt(reviewCount) * 3; // Reviews weighted more
        userScores.set(userId, current);
      } else {
        userScores.set(userId, {
          id: userId,
          watchCount: 0,
          reviewCount: parseInt(reviewCount),
          activityScore: parseInt(reviewCount) * 3
        });
      }
    });
    
    // Get top users by activity score
    const topUserIds: string[] = [...userScores.entries()]
      .sort((a, b) => b[1].activityScore - a[1].activityScore)
      .slice(0, 10)
      .map(([id]) => id);
    
    // Get user details
    const users = await this.userRepository.findByIds(topUserIds);
    
    // Return with activity details
    return topUserIds.map(id => {
      const user = users.find(u => u.id === id);
      const stats = userScores.get(id);
      
      // Check if user exists
      if (user) {
        return {
          id: user.id,
          username: user.username,
          avatarUrl: user.avatarUrl,
          activityStats: {
            watchCount: stats.watchCount,
            reviewCount: stats.reviewCount,
            activityScore: stats.activityScore
          }
        };
      } else {
        return {
          id: id,
          username: 'Unknown User',
          avatarUrl: null,
          activityStats: stats
        };
      }
    });
  }
}