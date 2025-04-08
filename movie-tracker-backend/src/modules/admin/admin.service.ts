// src/modules/admin/admin.service.ts
import { Injectable, NotFoundException, ForbiddenException, Logger, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan, MoreThan, IsNull, Not } from 'typeorm';
import { ModerationLog } from '../moderation/entities/moderation-log.entity';
import { Report } from '../moderation/entities/report.entity';
import { User } from '../users/entities/user.entity';
import { Review } from '../reviews/entities/review.entity';
import { Movie } from '../movies/entities/movie.entity';
import { List } from '../lists/entities/list.entity';
import { WatchHistory } from '../watch-history/entities/watch-history.entity';
import { Activity } from '../social/entities/activity.entity';
import { UpdateAdminInput } from './dto/update-admin.input';
import { ResolveReportInput } from './dto/report.dto';
import { ReportStats } from './dto/report-stats.type';
import { CreateModerationLogInput } from './dto/create-moderation-log.input';
import { AdminDashboardStats } from './dto/admin-dashboard-stats.dto';
import { AdminContentStats } from './dto/admin-content-stats.dto';
import { AdminUserStats } from './dto/admin-user-stats.dto';
import { UserRoleStats } from './dto/user-role-stats.dto';
import { ModerationAction, ReportStatus, UserRole, ReviewStatus } from 'src/common/enums';
import { UserReputationService } from '../moderation/services/user-reputation.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(ModerationLog)
    private moderationLogRepository: Repository<ModerationLog>,
    @InjectRepository(Report)
    private reportRepository: Repository<Report>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(Movie)
    private movieRepository: Repository<Movie>,
    @InjectRepository(List)
    private listRepository: Repository<List>,
    @InjectRepository(WatchHistory)
    private watchHistoryRepository: Repository<WatchHistory>,
    @InjectRepository(Activity)
    private activityRepository: Repository<Activity>,
    private readonly userReputationService: UserReputationService
  ) {}

  /**
   * Get detailed admin dashboard statistics
   */
  async getDashboardStats(): Promise<AdminDashboardStats> {
    // Get current time and date ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const lastWeekStart = new Date(today);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    
    const lastMonthStart = new Date(today);
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);

    // Perform all queries in parallel for efficiency
    const [
      totalUsers,
      newUsersToday,
      newUsersLastWeek,
      newUsersLastMonth,
      activeUsersToday,
      activeUsersLastWeek,
      totalReviews,
      newReviewsToday,
      pendingReviews,
      flaggedReviews,
      totalMovies,
      totalLists,
      totalWatches,
      pendingReports,
      resolvedReports,
      moderationLogsToday,
      totalModerationLogs
    ] = await Promise.all([
      // User stats
      this.userRepository.count(),
      this.userRepository.count({ where: { createdAt: MoreThan(today) } }),
      this.userRepository.count({ where: { createdAt: Between(lastWeekStart, now) } }),
      this.userRepository.count({ where: { createdAt: Between(lastMonthStart, now) } }),
      this.userRepository.count({ where: { lastActivityAt: MoreThan(today) } }),
      this.userRepository.count({ where: { lastActivityAt: Between(lastWeekStart, now) } }),
      
      // Review stats
      this.reviewRepository.count(),
      this.reviewRepository.count({ where: { createdAt: MoreThan(today) } }),
      this.reviewRepository.count({ where: { status: ReviewStatus.PENDING } }),
      this.reviewRepository.count({ where: { isFlagged: true } }),
      
      // Content stats
      this.movieRepository.count(),
      this.listRepository.count(),
      this.watchHistoryRepository.count(),
      
      // Report stats
      this.reportRepository.count({ where: { status: ReportStatus.PENDING } }),
      this.reportRepository.count({ where: { status: Not(ReportStatus.PENDING) } }),
      
      // Moderation stats
      this.moderationLogRepository.count({ where: { createdAt: MoreThan(today) } }),
      this.moderationLogRepository.count()
    ]);

    // Get user role distribution
    const userRoleStats = await this.getUserRoleStats();

    return {
      users: {
        total: totalUsers,
        newToday: newUsersToday,
        newLastWeek: newUsersLastWeek,
        newLastMonth: newUsersLastMonth,
        activeToday: activeUsersToday,
        activeLastWeek: activeUsersLastWeek,
        roleDistribution: userRoleStats
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
        pendingReports,
        resolvedReports,
        moderationLogsToday,
        totalModerationLogs
      }
    };
  }

  /**
   * Get user role distribution statistics
   */
  async getUserRoleStats(): Promise<UserRoleStats[]> {
    const roleStats: UserRoleStats[] = [];
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
   * Get content statistics by type, creation date, status, etc.
   */
  async getContentStats(): Promise<AdminContentStats> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastWeekStart = new Date(today);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastMonthStart = new Date(today);
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);

    // Get review stats
    const reviewStats = {
      total: await this.reviewRepository.count(),
      today: await this.reviewRepository.count({ where: { createdAt: MoreThan(today) } }),
      lastWeek: await this.reviewRepository.count({ where: { createdAt: Between(lastWeekStart, now) } }),
      lastMonth: await this.reviewRepository.count({ where: { createdAt: Between(lastMonthStart, now) } }),
      pending: await this.reviewRepository.count({ where: { status: ReviewStatus.PENDING } }),
      approved: await this.reviewRepository.count({ where: { status: ReviewStatus.APPROVED } }),
      rejected: await this.reviewRepository.count({ where: { status: ReviewStatus.REJECTED } }),
      flagged: await this.reviewRepository.count({ where: { isFlagged: true } })
    };

    // Get list stats
    const listStats = {
      total: await this.listRepository.count(),
      today: await this.listRepository.count({ where: { createdAt: MoreThan(today) } }),
      lastWeek: await this.listRepository.count({ where: { createdAt: Between(lastWeekStart, now) } }),
      lastMonth: await this.listRepository.count({ where: { createdAt: Between(lastMonthStart, now) } }),
    };

    // Get watch history stats
    const watchStats = {
      total: await this.watchHistoryRepository.count(),
      today: await this.watchHistoryRepository.count({ where: { createdAt: MoreThan(today) } }),
      lastWeek: await this.watchHistoryRepository.count({ where: { createdAt: Between(lastWeekStart, now) } }),
      lastMonth: await this.watchHistoryRepository.count({ where: { createdAt: Between(lastMonthStart, now) } }),
    };

    // Calculate popular movies
    const popularMovies = await this.movieRepository.find({
      order: { voteCount: 'DESC' },
      take: 10
    });

    // Calculate trending genres
    const trendingGenres = await this.calculateTrendingGenres();

    return {
      reviews: reviewStats,
      lists: listStats,
      watches: watchStats,
      popularMovies,
      trendingGenres
    };
  }

  /**
   * Get user statistics for admin dashboard
   */
  async getUserStats(): Promise<AdminUserStats> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastWeekStart = new Date(today);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastMonthStart = new Date(today);
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);

    // Get user registration stats
    const registrationStats = {
      total: await this.userRepository.count(),
      today: await this.userRepository.count({ where: { createdAt: MoreThan(today) } }),
      lastWeek: await this.userRepository.count({ where: { createdAt: Between(lastWeekStart, now) } }),
      lastMonth: await this.userRepository.count({ where: { createdAt: Between(lastMonthStart, now) } }),
    };

    // Get user activity stats
    const activityStats = {
      activeToday: await this.userRepository.count({ where: { lastActivityAt: MoreThan(today) } }),
      activeLastWeek: await this.userRepository.count({ where: { lastActivityAt: Between(lastWeekStart, now) } }),
      activeLastMonth: await this.userRepository.count({ where: { lastActivityAt: Between(lastMonthStart, now) } }),
      neverActive: await this.userRepository.count({ where: { lastActivityAt: IsNull() } }),
    };

    // Calculate most active users
    const mostActiveUsers = await this.userRepository.find({
      order: { lastActivityAt: 'DESC' },
      take: 10
    });

    // Calculate top content creators
    const topReviewers = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.reviews', 'review')
      .groupBy('user.id')
      .addGroupBy('user.username')
      .addGroupBy('user.avatarUrl')
      .select(['user.id as id', 'user.username as username', 'user.avatarUrl as avatarUrl', 'COUNT(review.id) as reviewCount'])
      .orderBy('reviewCount', 'DESC')
      .limit(10)
      .getRawMany();

    return {
      registration: registrationStats,
      activity: activityStats,
      mostActiveUsers,
      topReviewers
    };
  }

  /**
   * Calculate trending genres based on recent reviews and watches
   */
  private async calculateTrendingGenres(): Promise<{genre: string, count: number}[]> {
    const lastMonthStart = new Date();
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);

    // Get recent watches and count genres
    const recentWatches = await this.watchHistoryRepository.find({
      where: { createdAt: MoreThan(lastMonthStart) },
      relations: ['movie']
    });

    const genreCounts = {};
    
    // Count genres from watch history
    recentWatches.forEach(watch => {
      if (watch.movie && watch.movie.genres) {
        watch.movie.genres.forEach(genre => {
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        });
      }
    });

    // Convert to array and sort
    return Object.entries(genreCounts)
      .map(([genre, count]) => ({ genre, count: count as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  async findOne(id: string): Promise<ModerationLog> {
    const log = await this.moderationLogRepository.findOne({
      where: { id },
      relations: ['moderator', 'targetUser', 'targetReview'],
    });

    if (!log) {
      throw new NotFoundException(`Moderation log with ID ${id} not found`);
    }

    return log;
  }

  async create(moderator: User, input: CreateModerationLogInput): Promise<ModerationLog> {
    const log = this.moderationLogRepository.create({
      ...input,
      moderator,
      isResolved: false,
    });
    
    return this.moderationLogRepository.save(log);
  }

  async update(id: string, input: UpdateAdminInput): Promise<ModerationLog> {
    const log = await this.findOne(id);
    
    if (input.notes) {
      log.notes = input.notes;
    }
    
    if (typeof input.isResolved !== 'undefined') {
      log.isResolved = input.isResolved;
      if (input.isResolved) {
        log.resolvedAt = new Date();
      }
    }

    return this.moderationLogRepository.save(log);
  }

  async moderateUser(
    moderator: User,
    userId: string,
    action: ModerationAction,
    reason: string,
  ): Promise<ModerationLog> {
    // Find the user to moderate
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Only admins can moderate moderators or admins
    if ((user.roles.includes(UserRole.MODERATOR) || user.roles.includes(UserRole.ADMIN)) 
        && !moderator.roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException('Only admins can moderate moderators or admins');
    }

    // Apply the moderation action to the user
    await this.applyUserModeration(user, action, reason);

    // Create a moderation log
    const log = this.moderationLogRepository.create({
      moderator,
      action,
      reason,
      createdAt: new Date(),
      targetUser: user,
      isResolved: true,
      resolvedAt: new Date()
    });

    return this.moderationLogRepository.save(log);
  }

  /**
   * Apply moderation action to a user
   */
  private async applyUserModeration(
    user: User, 
    action: ModerationAction,
    reason: string
  ): Promise<void> {
    switch (action) {
      case ModerationAction.USER_WARNED:
        user.warningCount = (user.warningCount || 0) + 1;
        user.lastWarningReason = reason;
        user.lastWarningAt = new Date();
        break;
      
      case ModerationAction.USER_SUSPENDED:
        // Suspend for 7 days by default
        const suspendedUntil = new Date();
        suspendedUntil.setDate(suspendedUntil.getDate() + 7);
        
        user.suspendedUntil = suspendedUntil;
        user.suspensionReason = reason;
        break;
      
      case ModerationAction.USER_BANNED:
        user.isBanned = true;
        user.banReason = reason;
        user.bannedAt = new Date();
        break;
    }

    await this.userRepository.save(user);

    // Update user reputation
    if (action === ModerationAction.USER_WARNED) {
      await this.userReputationService.adjustReputationScore({
        userId: user.id,
        adjustment: -5,
        reason: 'User received warning'
      });
    } else if (action === ModerationAction.USER_SUSPENDED) {
      await this.userReputationService.adjustReputationScore({
        userId: user.id,
        adjustment: -25,
        reason: 'User suspended'
      });
    } else if (action === ModerationAction.USER_BANNED) {
      await this.userReputationService.adjustReputationScore({
        userId: user.id,
        adjustment: -100, // Effectively set to minimum
        reason: 'User banned'
      });
    }
  }

  async getReportStats(): Promise<ReportStats> {
    const [total, pending, resolved, dismissed] = await Promise.all([
      this.reportRepository.count(),
      this.reportRepository.count({ where: { status: ReportStatus.PENDING } }),
      this.reportRepository.count({ where: { status: ReportStatus.RESOLVED } }),
      this.reportRepository.count({ where: { status: ReportStatus.DISMISSED } }),
    ]);

    return {
      totalReports: total,
      pendingReports: pending,
      resolvedReports: resolved,
      dismissedReports: dismissed,
    };
  }

  async getPendingReportsCount(): Promise<number> {
    return this.reportRepository.count({
      where: { status: ReportStatus.PENDING },
    });
  }

  async resolveReport(moderator: User, input: ResolveReportInput): Promise<ModerationLog> {
    const report = await this.reportRepository.findOne({
      where: { id: input.reportId },
      relations: ['review'],
    });

    if (!report) {
      throw new NotFoundException(`Report with ID ${input.reportId} not found`);
    }

    report.status = ReportStatus.RESOLVED;
    report.moderator = moderator;
    report.moderatorId = moderator.id;
    report.resolvedAt = new Date();
    report.moderatorNotes = input.moderatorNotes || undefined;
    report.resolution = input.resolution;

    await this.reportRepository.save(report);

    // Create moderation log
    const log = this.moderationLogRepository.create({
      moderator,
      action: ModerationAction.REVIEW_APPROVED, // Default action
      reason: input.moderatorNotes || 'Report resolved',
      targetReview: report.review,
      targetUser: report.review?.user,
      createdAt: new Date(),
      isResolved: true,
      resolvedAt: new Date(),
    });

    return this.moderationLogRepository.save(log);
  }

  async findAll(filters: {
    isResolved?: boolean;
    moderatorId?: string;
    targetUserId?: string;
    take?: number;
    skip?: number;
  } = {}): Promise<[ModerationLog[], number]> {
    const query = this.moderationLogRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.moderator', 'moderator')
      .leftJoinAndSelect('log.targetUser', 'targetUser')
      .leftJoinAndSelect('log.targetReview', 'targetReview');

    if (typeof filters.isResolved !== 'undefined') {
      query.andWhere('log.isResolved = :isResolved', {
        isResolved: filters.isResolved,
      });
    }

    if (filters.moderatorId) {
      query.andWhere('moderator.id = :moderatorId', {
        moderatorId: filters.moderatorId,
      });
    }

    if (filters.targetUserId) {
      query.andWhere('targetUser.id = :targetUserId', {
        targetUserId: filters.targetUserId,
      });
    }

    if (filters.take) {
      query.take(filters.take);
    }

    if (filters.skip) {
      query.skip(filters.skip);
    }

    query.orderBy('log.createdAt', 'DESC');

    return query.getManyAndCount();
  }

  /**
   * Set user role
   */
  async setUserRole(userId: string, role: UserRole, add: boolean): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (add) {
      // Add role if not present
      if (!user.roles.includes(role)) {
        user.roles = [...user.roles, role];
      }
    } else {
      // Remove role if present
      user.roles = user.roles.filter(r => r !== role);
    }

    return this.userRepository.save(user);
  }

  /**
   * Ban a user
   */
  async banUser(userId: string, reason: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    user.isBanned = true;
    user.banReason = reason;
    user.bannedAt = new Date();

    return this.userRepository.save(user);
  }

  /**
   * Unban a user
   */
  async unbanUser(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    user.isBanned = false;
    user.banReason = undefined;
    user.bannedAt = undefined;

    return this.userRepository.save(user);
  }

  /**
   * Search users by username or email
   */
  async searchUsers(query: string, page = 1, limit = 10): Promise<[User[], number]> {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .where('user.username ILIKE :query', { query: `%${query}%` })
      .orWhere('user.email ILIKE :query', { query: `%${query}%` })
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    return queryBuilder.getManyAndCount();
  }

  /**
   * Delete a user account (with option to keep content)
   */
  async deleteUser(userId: string, keepContent = false): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (keepContent) {
      // Just anonymize the user but keep their content
      user.username = `deleted_user_${userId.substring(0, 8)}`;
      user.email = `deleted_${userId.substring(0, 8)}@deleted.user`;
      user.avatarUrl = undefined;
      user.isBanned = true;
      user.emailVerified = false;
      user.bio = undefined;
      user.location = undefined;
      user.website = undefined;
      user.socialLinks = {};
      
      await this.userRepository.save(user);
      return true;
    } else {
      // Completely delete the user and all their content
      await this.userRepository.remove(user);
      return true;
    }
  }

  /**
   * Get the User repository for direct operations
   */
  getUsersRepository(): Repository<User> {
    return this.userRepository;
  }
  
  /**
   * Bulk set user roles
   */
  async bulkSetUserRole(userIds: string[], role: UserRole, add: boolean): Promise<{ successCount: number; failureCount: number; errors: string[] }> {
    const result = {
      successCount: 0,
      failureCount: 0,
      errors: [] as string[]
    };
    
    for (const userId of userIds) {
      try {
        await this.setUserRole(userId, role, add);
        result.successCount++;
      } catch (error) {
        result.failureCount++;
        result.errors.push(`Failed to update role for user ${userId}: ${error.message}`);
      }
    }
    
    return result;
  }
  
  /**
   * Bulk moderate users
   */
  async bulkModerateUsers(
    moderator: User,
    userIds: string[],
    action: ModerationAction,
    reason: string
  ): Promise<{ successCount: number; failureCount: number; errors: string[] }> {
    const result = {
      successCount: 0,
      failureCount: 0,
      errors: [] as string[]
    };
    
    for (const userId of userIds) {
      try {
        await this.moderateUser(moderator, userId, action, reason);
        result.successCount++;
      } catch (error) {
        result.failureCount++;
        result.errors.push(`Failed to moderate user ${userId}: ${error.message}`);
      }
    }
    
    return result;
  }

  /**
   * Check database health
   */
  async checkDatabaseHealth(): Promise<string> {
    try {
      // Execute a simple query to check database connectivity
      await this.userRepository.query('SELECT 1');
      return 'healthy';
    } catch (error) {
      this.logger.error(`Database health check failed: ${error.message}`);
      return 'unhealthy';
    }
  }
}