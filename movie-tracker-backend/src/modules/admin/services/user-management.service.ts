// src/modules/admin/services/user-management.service.ts
import { Injectable, NotFoundException, ForbiddenException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Between, MoreThan, LessThan, In, IsNull, Not } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Review } from '../../reviews/entities/review.entity';
import { List } from '../../lists/entities/list.entity';
import { WatchHistory } from '../../watch-history/entities/watch-history.entity';
import { AdminAuditLog, AdminActionType } from '../entities/admin-audit-log.entity';
import { UserRole, ModerationAction } from '../../../common/enums';
import { AuditService } from './audit.service';
import { CacheService } from '../../../common/services/cache.service';
import { CreateAuditLogInput } from '../dto/audit-log.dto';

@Injectable()
export class UserManagementService {
  private readonly logger = new Logger(UserManagementService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(List)
    private listRepository: Repository<List>,
    @InjectRepository(WatchHistory)
    private watchHistoryRepository: Repository<WatchHistory>,
    private readonly auditService: AuditService,
    private readonly cacheService: CacheService
  ) {}

  /**
   * Find users with filtering and pagination
   */
  async findUsers(options: {
    query?: string;
    role?: UserRole;
    isBanned?: boolean;
    isVerified?: boolean;
    startDate?: Date;
    endDate?: Date;
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
    page?: number;
    limit?: number;
  }): Promise<[User[], number]> {
    const { page = 1, limit = 10 } = options;
    
    // Build query
    let query = this.userRepository.createQueryBuilder('user');

    // Apply filters
    if (options.query) {
      query = query.where(
        '(user.username ILIKE :query OR user.email ILIKE :query)',
        { query: `%${options.query}%` }
      );
    }

    if (options.role) {
      query = query.andWhere(':role = ANY(user.roles)', { role: options.role });
    }

    if (typeof options.isBanned === 'boolean') {
      query = query.andWhere('user.isBanned = :isBanned', { isBanned: options.isBanned });
    }

    if (typeof options.isVerified === 'boolean') {
      query = query.andWhere('user.emailVerified = :isVerified', { isVerified: options.isVerified });
    }

    if (options.startDate && options.endDate) {
      query = query.andWhere('user.createdAt BETWEEN :startDate AND :endDate', {
        startDate: options.startDate,
        endDate: options.endDate
      });
    } else if (options.startDate) {
      query = query.andWhere('user.createdAt >= :startDate', { startDate: options.startDate });
    } else if (options.endDate) {
      query = query.andWhere('user.createdAt <= :endDate', { endDate: options.endDate });
    }

    // Apply sorting
    const orderBy = options.orderBy || 'createdAt';
    const orderDirection = options.orderDirection || 'DESC';
    query = query.orderBy(`user.${orderBy}`, orderDirection);

    // Apply pagination
    query = query.skip((page - 1) * limit).take(limit);

    // Execute query
    return query.getManyAndCount();
  }

  /**
   * Get user by ID with full details
   */
  async getUserWithDetails(userId: string): Promise<User & { stats?: any }> {
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Get user statistics
    const stats = await this.getUserStatistics(userId);

    return {
      ...user,
      stats
    };
  }

  /**
   * Get user statistics
   */
  async getUserStatistics(userId: string): Promise<any> {
    const cacheKey = `admin:user:${userId}:stats`;
    return this.cacheService.getOrFetch(
      cacheKey,
      async () => {
        const [
          reviewCount,
          avgReviewRating,
          listCount,
          watchCount,
          firstWatchDate,
          lastActivityDate
        ] = await Promise.all([
          // Review stats
          this.reviewRepository.count({ where: { user: { id: userId } } }),
          this.getAverageUserReviewRating(userId),
          
          // List stats
          this.listRepository.count({ where: { owner_id: userId } }),
          
          // Watch stats
          this.watchHistoryRepository.count({ where: { userId } }),
          this.getFirstWatchDate(userId),
          this.getLastActivityDate(userId)
        ]);

        return {
          content: {
            reviewCount,
            avgReviewRating,
            listCount,
            watchCount
          },
          activity: {
            firstWatchDate,
            lastActivityDate,
            daysActive: this.calculateActiveDays(firstWatchDate, lastActivityDate)
          }
        };
      },
      1800 // 30 minute cache
    );
  }

  /**
   * Update user role
   */
  async updateUserRole(userId: string, role: UserRole, add: boolean, admin: User): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Only admins can modify admin or moderator roles
    if ((role === UserRole.ADMIN || role === UserRole.MODERATOR) && 
        !admin.roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException('Only admins can assign or remove admin/moderator roles');
    }

    // Update roles
    let newRoles: UserRole[] = [...user.roles];
    
    if (add && !newRoles.includes(role)) {
      newRoles.push(role);
    } else if (!add) {
      newRoles = newRoles.filter(r => r !== role);
    }

    // Ensure user has at least the USER role
    if (!newRoles.includes(UserRole.USER)) {
      newRoles.push(UserRole.USER);
    }

    user.roles = newRoles;
    
    // Save user
    const savedUser = await this.userRepository.save(user);
    
    // Log the action
    await this.auditService.logAdminAction(
      admin.id, 
      `${add ? 'Added' : 'Removed'} ${role} role for user ${user.username}`,
      JSON.stringify({
        previousRoles: user.roles,
        newRoles: savedUser.roles
      }),
      userId,
      'User'
    );
    
    return savedUser;
  }

  /**
   * Ban a user
   */
  async banUser(userId: string, reason: string, admin: User): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Admin users cannot be banned by non-admins
    if (user.roles.includes(UserRole.ADMIN) && !admin.roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException('Only admins can ban admin users');
    }

    // Apply ban
    user.isBanned = true;
    user.banReason = reason;
    user.bannedAt = new Date();
    
    const savedUser = await this.userRepository.save(user);
    
    // Log the action
    await this.auditService.logAdminAction(
      admin.id,
      `Banned user ${user.username}`,
      JSON.stringify({
        reason,
        bannedAt: user.bannedAt
      }),
      userId,
      'User'
    );
    
    return savedUser;
  }

  /**
   * Unban a user
   */
  async unbanUser(userId: string, admin: User): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (!user.isBanned) {
      throw new BadRequestException(`User ${user.username} is not banned`);
    }

    // Remove ban
    user.isBanned = false;
    user.banReason = undefined;
    user.bannedAt = undefined;
    
    const savedUser = await this.userRepository.save(user);
    
    // Log the action
    await this.auditService.logAdminAction(
      admin.id,
      `Unbanned user ${user.username}`,
      '',
      userId,
      'User'
    );
    
    return savedUser;
  }

  /**
   * Suspend a user for a specific duration
   */
  async suspendUser(
    userId: string, 
    reason: string, 
    durationDays: number,
    admin: User
  ): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Admin users cannot be suspended by non-admins
    if (user.roles.includes(UserRole.ADMIN) && !admin.roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException('Only admins can suspend admin users');
    }

    // Calculate suspension end date
    const suspendedUntil = new Date();
    suspendedUntil.setDate(suspendedUntil.getDate() + durationDays);

    // Apply suspension
    user.suspendedUntil = suspendedUntil;
    user.suspensionReason = reason;
    
    const savedUser = await this.userRepository.save(user);
    
    // Log the action
    await this.auditService.logAdminAction(
      admin.id,
      `Suspended user ${user.username} for ${durationDays} days`,
      JSON.stringify({
        reason,
        durationDays,
        suspendedUntil
      }),
      userId,
      'User'
    );
    
    return savedUser;
  }

  /**
   * Remove suspension from a user
   */
  async removeSuspension(userId: string, admin: User): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (!user.suspendedUntil) {
      throw new BadRequestException(`User ${user.username} is not suspended`);
    }

    // Remove suspension
    user.suspendedUntil = undefined;
    user.suspensionReason = undefined;
    
    const savedUser = await this.userRepository.save(user);
    
    // Log the action
    await this.auditService.logAdminAction(
      admin.id,
      `Removed suspension for user ${user.username}`,
      '',
      userId,
      'User'
    );
    
    return savedUser;
  }

  /**
   * Issue a warning to a user
   */
  async warnUser(userId: string, reason: string, admin: User): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Increment warning count
    user.warningCount = (user.warningCount || 0) + 1;
    user.lastWarningReason = reason;
    user.lastWarningAt = new Date();
    
    const savedUser = await this.userRepository.save(user);
    
    // Log the action
    await this.auditService.logAdminAction(
      admin.id,
      `Warned user ${user.username}`,
      JSON.stringify({
        reason,
        warningCount: user.warningCount,
        lastWarningAt: user.lastWarningAt
      }),
      userId,
      'User'
    );
    
    return savedUser;
  }

  /**
   * Delete a user account with option to keep or remove content
   */
  async deleteUser(userId: string, keepContent: boolean, admin: User): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Admin users cannot be deleted by non-admins
    if (user.roles.includes(UserRole.ADMIN) && !admin.roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException('Only admins can delete admin users');
    }

    if (keepContent) {
      // Anonymize user but keep content
      const anonymizedUsername = `deleted_user_${userId.substring(0, 8)}`;
      const anonymizedEmail = `deleted_${userId.substring(0, 8)}@deleted.user`;
      
      // Backup user data for audit
      const userBackup = { ...user };
      
      // Anonymize user data
      user.username = anonymizedUsername;
      user.email = anonymizedEmail;
      user.avatarUrl = undefined;
      user.isBanned = true;
      user.emailVerified = false;
      user.bio = undefined;
      user.location = undefined;
      user.website = undefined;
      user.socialLinks = {};
      user.showActivity = false;
      user.showOnlineStatus = false;
      user.showWatchlist = false;
      
      await this.userRepository.save(user);
      
      // Log the action
      await this.auditService.logAdminAction(
        admin.id,
        `Anonymized user ${userBackup.username} (kept content)`,
        JSON.stringify({
          previousUsername: userBackup.username,
          previousEmail: userBackup.email,
          anonymizedUsername,
          anonymizedEmail,
          contentKept: true
        }),
        userId,
        'User'
      );
    } else {
      // Backup user data for audit
      const userBackup = { ...user };
      
      // Remove user completely
      await this.userRepository.remove(user);
      
      // Log the action
      await this.auditService.logAdminAction(
        admin.id,
        `Deleted user ${userBackup.username} with all content`,
        JSON.stringify({
          previousUsername: userBackup.username,
          previousEmail: userBackup.email,
          contentKept: false
        }),
        userId,
        'User'
      );
    }
    
    return true;
  }

  /**
   * Get user activity timeline
   */
  async getUserActivityTimeline(userId: string): Promise<any[]> {
    const cacheKey = `admin:user:${userId}:activity:timeline`;
    return this.cacheService.getOrFetch(
      cacheKey,
      async () => {
        // Get all user activities
        const [reviews, lists, watches, auditLogs] = await Promise.all([
          // Reviews
          this.reviewRepository.find({
            where: { user: { id: userId } },
            select: ['id', 'createdAt', 'rating', 'movie'],
            relations: ['movie'],
            order: { createdAt: 'DESC' }
          }),
          
          // Lists
          this.listRepository.find({
            where: { owner_id: userId },
            select: ['id', 'createdAt', 'name'],
            order: { createdAt: 'DESC' }
          }),
          
          // Watches
          this.watchHistoryRepository.find({
            where: { userId },
            select: ['id', 'createdAt', 'movieId', 'watchType'],
            relations: ['movie'],
            order: { createdAt: 'DESC' }
          }),
          
          // Admin actions on this user
          this.auditService.getUserAuditLogs(userId)
        ]);
        
        // Convert to timeline events
        const timeline = [
          // Reviews
          ...reviews.map(review => ({
            type: 'review',
            date: review.createdAt,
            data: {
              reviewId: review.id,
              movieTitle: review.movie?.title || 'Unknown Movie',
              rating: review.rating
            }
          })),
          
          // Lists
          ...lists.map(list => ({
            type: 'list',
            date: list.createdAt,
            data: {
              listId: list.id,
              listName: list.name
            }
          })),
          
          // Watches
          ...watches.map(watch => ({
            type: 'watch',
            date: watch.createdAt,
            data: {
              watchId: watch.id,
              movieTitle: watch.movie?.title || 'Unknown Movie',
              watchType: watch.watchType
            }
          })),
          
          // Admin actions
          ...(auditLogs[0] || []).map(log => ({
            type: 'admin_action',
            date: log.timestamp,
            data: {
              actionType: log.actionType,
              action: log.action,
              adminUsername: log.admin?.username || 'Unknown Admin'
            }
          }))
        ];
        
        // Sort by date descending
        return timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      },
      1800 // 30 minute cache
    );
  }

  /**
   * Get recently active users
   */
  async getRecentlyActiveUsers(days = 7, limit = 10): Promise<User[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return this.userRepository.find({
      where: { lastActivityAt: MoreThan(startDate) },
      order: { lastActivityAt: 'DESC' },
      take: limit
    });
  }

  /**
   * Get inactive users (no login for a long time)
   */
  async getInactiveUsers(days = 90, limit = 100): Promise<User[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return this.userRepository.find({
      where: [
        { lastActivityAt: LessThan(cutoffDate) },
        { lastActivityAt: IsNull() }
      ],
      order: { createdAt: 'ASC' },
      take: limit
    });
  }

  /**
   * Perform bulk operations on users
   */
  async bulkUpdateUsers(
    userIds: string[], 
    operation: 'ban' | 'unban' | 'suspend' | 'warn' | 'delete' | 'addRole' | 'removeRole',
    options: {
      reason?: string;
      durationDays?: number;
      role?: UserRole;
      keepContent?: boolean;
    },
    admin: User
  ): Promise<{
    successCount: number;
    failureCount: number;
    errors: string[];
  }> {
    const result = {
      successCount: 0,
      failureCount: 0,
      errors: [] as string[]
    };
    
    // Validate input
    if (!userIds || userIds.length === 0) {
      throw new BadRequestException('No user IDs provided for bulk operation');
    }
    
    if (userIds.length > 100) {
      throw new BadRequestException('Bulk operations limited to 100 users at once');
    }
    
    // Process each user
    for (const userId of userIds) {
      try {
        switch (operation) {
          case 'ban':
            await this.banUser(userId, options.reason || 'Bulk ban operation', admin);
            break;
          case 'unban':
            await this.unbanUser(userId, admin);
            break;
          case 'suspend':
            await this.suspendUser(
              userId, 
              options.reason || 'Bulk suspension operation', 
              options.durationDays || 7,
              admin
            );
            break;
          case 'warn':
            await this.warnUser(userId, options.reason || 'Bulk warning operation', admin);
            break;
          case 'delete':
            await this.deleteUser(userId, options.keepContent || false, admin);
            break;
          case 'addRole':
            if (!options.role) {
              throw new BadRequestException('Role is required for addRole operation');
            }
            await this.updateUserRole(userId, options.role, true, admin);
            break;
          case 'removeRole':
            if (!options.role) {
              throw new BadRequestException('Role is required for removeRole operation');
            }
            await this.updateUserRole(userId, options.role, false, admin);
            break;
        }
        
        result.successCount++;
      } catch (error) {
        result.failureCount++;
        result.errors.push(`Failed to process user ${userId}: ${error.message}`);
        this.logger.error(`Bulk operation error for user ${userId}: ${error.message}`, error.stack);
      }
    }
    
    // Log the bulk action
        await this.auditService.logAdminAction(
          admin.id,
          `Bulk ${operation} operation on ${userIds.length} users`,
          JSON.stringify({
            operation,
            userCount: userIds.length,
            options,
            result: {
              successCount: result.successCount,
              failureCount: result.failureCount
            }
          })
        );
    
    return result;
  }

  /**
   * Get user registration trend data
   */
  async getUserRegistrationTrends(period: 'day' | 'week' | 'month' = 'day', days = 30): Promise<any[]> {
    const cacheKey = `admin:user:registration:trends:${period}:${days}`;
    return this.cacheService.getOrFetch(
      cacheKey,
      async () => {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - days);
        
        let format: string;
        let interval: string;
        
        if (period === 'day') {
          format = 'YYYY-MM-DD';
          interval = '1 day';
        } else if (period === 'week') {
          format = 'YYYY-WW';
          interval = '1 week';
        } else { // month
          format = 'YYYY-MM';
          interval = '1 month';
        }
        
        // Generate series of dates
        const result = await this.userRepository
          .createQueryBuilder('user')
          .select(`TO_CHAR(user.createdAt, '${format}')`, 'period')
          .addSelect('COUNT(user.id)', 'count')
          .where('user.createdAt >= :startDate', { startDate })
          .andWhere('user.createdAt <= :endDate', { endDate })
          .groupBy(`TO_CHAR(user.createdAt, '${format}')`)
          .orderBy(`TO_CHAR(user.createdAt, '${format}')`)
          .getRawMany();
        
        return result.map(item => ({
          period: item.period,
          count: parseInt(item.count)
        }));
      },
      3600 // 1 hour cache
    );
  }

  // Helper functions
  private async getAverageUserReviewRating(userId: string): Promise<number> {
    const result = await this.reviewRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avg')
      .where('review.user_id = :userId', { userId })
      .getRawOne();
      
    return result ? parseFloat(result.avg) || 0 : 0;
  }
  
  private async getFirstWatchDate(userId: string): Promise<Date | null> {
    const watch = await this.watchHistoryRepository.findOne({
      where: { userId },
      order: { watchedAt: 'ASC' },
      select: ['watchedAt']
    });
    
    return watch ? watch.watchedAt : null;
  }
  
  private async getLastActivityDate(userId: string): Promise<Date | null> {
    // Get most recent activity of any type
    const [lastReview, lastWatch, lastList, lastLogin] = await Promise.all([
      this.reviewRepository.findOne({
        where: { user: { id: userId } },
        order: { createdAt: 'DESC' },
        select: ['createdAt']
      }),
      this.watchHistoryRepository.findOne({
        where: { userId },
        order: { createdAt: 'DESC' },
        select: ['createdAt']
      }),
      this.listRepository.findOne({
        where: { owner_id: userId },
        order: { createdAt: 'DESC' },
        select: ['createdAt']
      }),
      this.userRepository.findOne({
        where: { id: userId },
        select: ['lastLoginAt', 'lastActivityAt']
      })
    ]);
    
    // Find the most recent date
    const dates = [
      lastReview?.createdAt,
      lastWatch?.createdAt,
      lastList?.createdAt,
      lastLogin?.lastLoginAt,
      lastLogin?.lastActivityAt
    ].filter(Boolean) as Date[];
    
    if (dates.length === 0) {
      return null;
    }
    
    return new Date(Math.max(...dates.map(d => d.getTime())));
  }
  
  private calculateActiveDays(firstDate: Date | null, lastDate: Date | null): number {
    if (!firstDate || !lastDate) {
      return 0;
    }
    
    const diffTime = Math.abs(lastDate.getTime() - firstDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both days
  }
}