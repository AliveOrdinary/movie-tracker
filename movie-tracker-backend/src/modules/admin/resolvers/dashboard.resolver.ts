// src/modules/admin/resolvers/dashboard.resolver.ts
import { Resolver, Query, Args, Int, registerEnumType } from '@nestjs/graphql';
import { UseGuards, Logger } from '@nestjs/common';
import { AuthGuard } from '../../../auth/guards/auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { UserRole } from '../../../common/enums';
import { AdminService } from '../admin.service';
import { ContentAnalyticsService } from '../services/content-analytics.service';
import { SystemConfigService } from '../services/system-config.service';
import { AuditService } from '../services/audit.service';
import { AdminDashboardStats } from '../dto/admin-dashboard-stats.dto';
import { AdminContentStats } from '../dto/admin-content-stats.dto';
import { AdminUserStats } from '../dto/admin-user-stats.dto';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { TimeSeriesData } from '../dto/time-series.dto';

enum TimeFrame {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month'
}

registerEnumType(TimeFrame, {
  name: 'TimeFrame',
  description: 'Time frame for analytics data',
});

@Resolver()
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminDashboardResolver {
  private readonly logger = new Logger(AdminDashboardResolver.name);

  constructor(
    private readonly adminService: AdminService,
    private readonly contentAnalyticsService: ContentAnalyticsService,
    private readonly systemConfigService: SystemConfigService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Get comprehensive dashboard statistics for admin overview
   */
  @Query(() => AdminDashboardStats)
  async adminDashboard(): Promise<AdminDashboardStats> {
    this.logger.log('Fetching admin dashboard stats');
    return this.adminService.getDashboardStats();
  }

  /**
   * Get detailed content statistics
   */
  @Query(() => AdminContentStats)
  async adminContentStats(): Promise<AdminContentStats> {
    this.logger.log('Fetching admin content stats');
    return this.adminService.getContentStats();
  }

  /**
   * Get detailed user statistics
   */
  @Query(() => AdminUserStats)
  async adminUserStats(): Promise<AdminUserStats> {
    this.logger.log('Fetching admin user stats');
    return this.adminService.getUserStats();
  }

  /**
   * Get user registration trends over time
   * @param timeframe The timeframe to analyze (day, week, month)
   * @param period The number of periods to include
   */
  @Query(() => TimeSeriesData)
  async userRegistrationTrends(
    @Args('timeframe', { type: () => TimeFrame, defaultValue: TimeFrame.DAY }) timeframe: TimeFrame,
    @Args('period', { type: () => Int, defaultValue: 30 }) period: number,
  ): Promise<TimeSeriesData> {
    this.logger.log(`Fetching user registration trends for ${timeframe} over ${period} periods`);
    return this.contentAnalyticsService.getUserRegistrationTrends(timeframe, period);
  }

  /**
   * Get review creation trends over time
   * @param timeframe The timeframe to analyze (day, week, month)
   * @param period The number of periods to include
   */
  @Query(() => TimeSeriesData)
  async reviewTrends(
    @Args('timeframe', { type: () => TimeFrame, defaultValue: TimeFrame.DAY }) timeframe: TimeFrame,
    @Args('period', { type: () => Int, defaultValue: 30 }) period: number,
  ): Promise<TimeSeriesData> {
    this.logger.log(`Fetching review trends for ${timeframe} over ${period} periods`);
    return this.contentAnalyticsService.getReviewTrends(timeframe, period);
  }

  /**
   * Get watch activity trends over time
   * @param timeframe The timeframe to analyze (day, week, month)
   * @param period The number of periods to include
   */
  @Query(() => TimeSeriesData)
  async watchActivityTrends(
    @Args('timeframe', { type: () => TimeFrame, defaultValue: TimeFrame.DAY }) timeframe: TimeFrame,
    @Args('period', { type: () => Int, defaultValue: 30 }) period: number,
  ): Promise<TimeSeriesData> {
    this.logger.log(`Fetching watch activity trends for ${timeframe} over ${period} periods`);
    return this.contentAnalyticsService.getWatchActivityTrends(timeframe, period);
  }

  /**
   * Log admin action for audit purposes
   */
  @Query(() => Boolean)
  async logAdminAction(
    @CurrentUser() admin: User,
    @Args('action') action: string,
    @Args('details', { nullable: true }) details?: string,
    @Args('entityId', { nullable: true }) entityId?: string,
    @Args('entityType', { nullable: true }) entityType?: string,
  ): Promise<boolean> {
    this.logger.log(`Admin ${admin.id} performing action: ${action}`);
    await this.auditService.logAdminAction(admin.id, action, details);
    return true;
  }

  /**
   * Get the latest system health status
   */
  @Query(() => Boolean)
  async checkServiceHealth(): Promise<boolean> {
    this.logger.log('Checking service health');
    // Perform basic health checks
    const dbStatus = await this.adminService.checkDatabaseHealth();
    // Add more health checks as needed
    return dbStatus === 'healthy';
  }
}