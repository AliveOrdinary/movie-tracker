// src/modules/admin/services/dashboard.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan, LessThan } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Review } from '../../reviews/entities/review.entity';
import { Movie } from '../../movies/entities/movie.entity';
import { List } from '../../lists/entities/list.entity';
import { WatchHistory } from '../../watch-history/entities/watch-history.entity';
import { CacheService } from '../../../common/services/cache.service';
import { CacheKeyFactory } from '../../../common/factories/cache-key.factory';
import { EntityCacheTTL } from '../../../common/constants/cache-ttl.constants';
import { TimeSeriesData } from '../dto/time-series.dto';
import { AdminDashboardStats } from '../dto/admin-dashboard-stats.dto';
import { UserRole, ReviewStatus } from '../../../common/enums';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    @InjectRepository(List)
    private readonly listRepository: Repository<List>,
    @InjectRepository(WatchHistory)
    private readonly watchHistoryRepository: Repository<WatchHistory>,
    private readonly cacheService: CacheService,
    protected readonly cacheKeyFactory: CacheKeyFactory,
  ) {}

  /**
   * Get summary statistics for dashboard
   */
  async getDashboardSummary(): Promise<AdminDashboardStats> {
    return this.cacheService.getOrFetch(
      this.cacheKeyFactory.generate('admin', 'dashboard', ['summary']),
      async () => {
        // Get current time and date ranges
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const lastWeekStart = new Date(today);
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);
        
        const lastMonthStart = new Date(today);
        lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);

        // Get user stats
        const [
          totalUsers,
          newUsersToday,
          newUsersLastWeek,
          newUsersLastMonth,
          activeUsersToday,
          activeUsersLastWeek,
        ] = await Promise.all([
          this.userRepository.count(),
          this.userRepository.count({ where: { createdAt: MoreThan(today) } }),
          this.userRepository.count({ where: { createdAt: Between(lastWeekStart, now) } }),
          this.userRepository.count({ where: { createdAt: Between(lastMonthStart, now) } }),
          this.userRepository.count({ where: { lastActivityAt: MoreThan(today) } }),
          this.userRepository.count({ where: { lastActivityAt: Between(lastWeekStart, now) } }),
        ]);

        // Get content stats
        const [
          totalReviews,
          newReviewsToday,
          pendingReviews,
          flaggedReviews,
          totalMovies,
          totalLists,
          totalWatches,
        ] = await Promise.all([
          this.reviewRepository.count(),
          this.reviewRepository.count({ where: { createdAt: MoreThan(today) } }),
          this.reviewRepository.count({ where: { status: ReviewStatus.PENDING } }),
          this.reviewRepository.count({ where: { isFlagged: true } }),
          this.movieRepository.count(),
          this.listRepository.count(),
          this.watchHistoryRepository.count(),
        ]);

        // Get user role distribution
        const roleStats = await this.getUserRoleDistribution();

        return {
          users: {
            total: totalUsers,
            newToday: newUsersToday,
            newLastWeek: newUsersLastWeek,
            newLastMonth: newUsersLastMonth,
            activeToday: activeUsersToday,
            activeLastWeek: activeUsersLastWeek,
            roleDistribution: roleStats
          },
          content: {
            totalReviews,
            newReviewsToday,
            pendingReviews,
            flaggedReviews,
            totalMovies,
            totalLists,
            totalWatches
          },
          moderation: {
            pendingReports: 0, // Will be populated from moderation service
            resolvedReports: 0, 
            moderationLogsToday: 0,
            totalModerationLogs: 0
          }
        };
      },
      EntityCacheTTL.ADMIN_DASHBOARD
    );
  }

  /**
   * Get user role distribution
   */
  private async getUserRoleDistribution(): Promise<any[]> {
    const roleStats: { role: UserRole; count: number; percentage: number }[] = [];
    const totalUsers = await this.userRepository.count();
    
    for (const role of Object.values(UserRole)) {
      const count = await this.userRepository
        .createQueryBuilder('user')
        .where(`'${role}' = ANY(user.roles)`)
        .getCount();
      
      roleStats.push({
        role,
        count,
        percentage: totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0
      });
    }
    
    return roleStats;
  }

  /**
   * Get activity trends for different timeframes
   */
  async getActivityTrends(
    entityType: 'user' | 'review' | 'watch',
    timeframe: 'day' | 'week' | 'month',
    period: number
  ): Promise<TimeSeriesData> {
    const cacheKey = this.cacheKeyFactory.generate('admin', 'dashboard', ['trends', entityType, timeframe, period.toString()]);
    
    return this.cacheService.getOrFetch(
      cacheKey,
      async () => {
        const now = new Date();
        const labels: string[] = [];
        const series: number[] = [];
        
        // Configure repository and date format based on entity type
        let repository: Repository<any>;
        switch (entityType) {
          case 'user':
            repository = this.userRepository;
            break;
          case 'review':
            repository = this.reviewRepository;
            break;
          case 'watch':
            repository = this.watchHistoryRepository;
            break;
        }
        
        // Generate time periods and count data
        for (let i = period - 1; i >= 0; i--) {
          const startDate = new Date(now);
          const endDate = new Date(now);
          
          // Adjust dates based on timeframe
          if (timeframe === 'day') {
            startDate.setDate(startDate.getDate() - i);
            startDate.setHours(0, 0, 0, 0);
            
            endDate.setDate(endDate.getDate() - i);
            endDate.setHours(23, 59, 59, 999);
            
            // Format: "Jan 1"
            labels.push(startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
          } 
          else if (timeframe === 'week') {
            startDate.setDate(startDate.getDate() - (i * 7));
            startDate.setHours(0, 0, 0, 0);
            
            endDate.setDate(endDate.getDate() - (i * 7) + 6);
            endDate.setHours(23, 59, 59, 999);
            
            // Format: "Jan 1 - Jan 7"
            labels.push(
              `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
            );
          } 
          else if (timeframe === 'month') {
            startDate.setMonth(startDate.getMonth() - i);
            startDate.setDate(1);
            startDate.setHours(0, 0, 0, 0);
            
            endDate.setMonth(endDate.getMonth() - i + 1);
            endDate.setDate(0);
            endDate.setHours(23, 59, 59, 999);
            
            // Format: "Jan 2023"
            labels.push(startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
          }
          
          // Count entities created in this period
          const count = await repository.count({
            where: {
              createdAt: Between(startDate, endDate)
            }
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
      EntityCacheTTL.ADMIN_ANALYTICS
    );
  }
}
