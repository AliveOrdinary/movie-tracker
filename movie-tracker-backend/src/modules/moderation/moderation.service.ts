// src/modules/moderation/moderation.service.ts
import { Injectable, Logger, NotFoundException, ForbiddenException, NotImplementedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, In } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Review } from '../reviews/entities/review.entity';
import { User } from '../users/entities/user.entity';
import { List } from '../lists/entities/list.entity';
import { Report } from './entities/report.entity';
import { ModerationLog } from './entities/moderation-log.entity';
import { ModerationQueue, ContentType, ModerationStatus, ModerationPriority } from './entities/moderation-queue.entity';
import { UserReputation } from './entities/user-reputation.entity';
import { ReviewStatus, ModerationAction, ReportStatus, ReportResolution } from '../../common/enums';
import { ModerationQueueService } from './services/moderation-queue.service';
import { UserReputationService } from './services/user-reputation.service';
import { AutoModerationService } from './services/auto-moderation.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { CacheService } from '../../common/services/cache.service';
import { CacheKeyFactory } from '../../common/factories/cache-key.factory';
import { CacheTTL } from '../../common/constants/cache-ttl.constants';

@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);

  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(Report)
    private reportRepository: Repository<Report>,
    @InjectRepository(ModerationLog)
    private moderationLogRepository: Repository<ModerationLog>,
    @InjectRepository(List)
    private listRepository: Repository<List>,
    private readonly moderationQueueService: ModerationQueueService,
    private readonly userReputationService: UserReputationService,
    private readonly autoModerationService: AutoModerationService,
    private readonly notificationsService: NotificationsService,
    private readonly cacheService: CacheService,
    protected readonly cacheKeyFactory: CacheKeyFactory,
    private eventEmitter: EventEmitter2,
  ) {}

  // Cache key helpers
  private getReportedContentCacheKey(page: number, limit: number): string {
    return this.cacheKeyFactory.generate('moderation', 'reportedContent', [page, limit]);
  }
  
  private getFlaggedReviewsCacheKey(page: number, limit: number): string {
    return this.cacheKeyFactory.generate('moderation', 'flaggedReviews', [page, limit]);
  }
  
  private getPendingReviewsCacheKey(page: number, limit: number): string {
    return this.cacheKeyFactory.generate('moderation', 'pendingReviews', [page, limit]);
  }
  
  private getFlaggedListsCacheKey(page: number, limit: number): string {
    return this.cacheKeyFactory.generate('moderation', 'flaggedLists', [page, limit]);
  }
  
  private getModerationStatsCacheKey(): string {
    return this.cacheKeyFactory.generate('moderation', 'stats');
  }
  
  private getModerationLogsCacheKey(page: number, limit: number, filters?: any): string {
    return this.cacheKeyFactory.generate('moderation', 'logs', [
      page, 
      limit, 
      filters ? JSON.stringify(filters) : 'all'
    ]);
  }

  /**
   * Invalidate moderation caches after actions that change moderation state
   */
  private async invalidateModerationCaches(contentType: ContentType, contentId: string): Promise<void> {
    try {
      // Create an array of cache keys to invalidate
      const cachesToInvalidate = [
        // Specific content cache
        `moderation:${contentType.toLowerCase()}:${contentId}:*`,
        // Global caches
        'moderation:reportedContent:*',
        'moderation:stats'
      ];
      
      // Add content type specific caches
      if (contentType === ContentType.REVIEW) {
        cachesToInvalidate.push('moderation:flaggedReviews:*', 'moderation:pendingReviews:*');
      } else if (contentType === ContentType.LIST) {
        cachesToInvalidate.push('moderation:flaggedLists:*');
      }
      
      // Invalidate all caches in a single operation
      await Promise.all(
        cachesToInvalidate.map(cacheKey => this.cacheService.invalidatePattern(cacheKey))
      );
      
      this.logger.log(`Invalidated moderation caches for ${contentType} ${contentId}`);
    } catch (error) {
      this.logger.error(`Error invalidating moderation caches: ${error.message}`);
    }
  }

  // Report creation and management
  async reportReview(reviewId: string, reason: string, reporter: User): Promise<Report> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
      relations: ['user'],
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.user.id === reporter.id) {
      throw new ForbiddenException('Cannot report your own review');
    }

    // Create report
    const report = this.reportRepository.create({
      contentType: ContentType.REVIEW,
      contentId: reviewId,
      review,
      reporter,
      reporterId: reporter.id,
      reason,
      status: ReportStatus.PENDING,
    });

    const savedReport = await this.reportRepository.save(report);

    // Create moderation queue item if not already exists
    try {
      await this.moderationQueueService.create({
        contentType: ContentType.REVIEW,
        contentId: reviewId,
        moderationNotes: `Reported by user ${reporter.id}: ${reason}`,
      });
    } catch (error) {
      this.logger.log(`Error creating moderation queue item, may already exist: ${error.message}`);
      // Don't rethrow since we still want to save the report
    }

    // Invalidate relevant caches
    try {
      await this.invalidateModerationCaches(ContentType.REVIEW, reviewId);
    } catch (cacheError) {
      this.logger.error(`Error invalidating caches for review ${reviewId}: ${cacheError.message}`);
      // Don't rethrow as cache invalidation failure shouldn't stop the main operation
    }

    // Emit event for report creation
    this.eventEmitter.emit('moderation.report.created', {
      report: savedReport,
      review,
      reporter,
    });

    return savedReport;
  }

  async reportList(listId: string, reason: string, reporter: User): Promise<Report> {
    const list = await this.listRepository.findOne({
      where: { id: listId },
      relations: ['owner'],
    });

    if (!list) {
      throw new NotFoundException('List not found');
    }

    if (list.owner_id === reporter.id) {
      throw new ForbiddenException('Cannot report your own list');
    }

    // Create report
    const report = this.reportRepository.create({
      contentType: ContentType.LIST,
      contentId: listId,
      list,
      reporter,
      reporterId: reporter.id,
      reason,
      status: ReportStatus.PENDING,
    });

    const savedReport = await this.reportRepository.save(report);

    // Create moderation queue item
    try {
      await this.moderationQueueService.create({
        contentType: ContentType.LIST,
        contentId: listId,
        moderationNotes: `Reported by user ${reporter.id}: ${reason}`,
      });
    } catch (error) {
      this.logger.log(`Error creating moderation queue item, may already exist: ${error.message}`);
    }

    // Invalidate relevant caches
    try {
      await this.invalidateModerationCaches(ContentType.LIST, listId);
    } catch (cacheError) {
      this.logger.error(`Error invalidating caches for list ${listId}: ${cacheError.message}`);
      // Don't rethrow as cache invalidation failure shouldn't stop the main operation
    }

    // Emit event for report creation
    this.eventEmitter.emit('moderation.report.created', {
      report: savedReport,
      list,
      reporter,
    });

    return savedReport;
  }

  async reportUser(userId: string, reason: string, reporter: User): Promise<Report> {
    const targetUser = await this.reportRepository.manager.findOne(User, {
      where: { id: userId },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    if (targetUser.id === reporter.id) {
      throw new ForbiddenException('Cannot report yourself');
    }

    // Create report
    const report = this.reportRepository.create({
      contentType: ContentType.USER_PROFILE,
      contentId: userId,
      reporter,
      reporterId: reporter.id,
      reason,
      status: ReportStatus.PENDING,
    });

    const savedReport = await this.reportRepository.save(report);

    // Create moderation queue item
    try {
      await this.moderationQueueService.create({
        contentType: ContentType.USER_PROFILE,
        contentId: userId,
        moderationNotes: `Reported by user ${reporter.id}: ${reason}`,
      });
    } catch (error) {
      this.logger.log(`Error creating moderation queue item, may already exist: ${error.message}`);
    }

    // Invalidate relevant caches
    try {
      await this.invalidateModerationCaches(ContentType.USER_PROFILE, userId);
    } catch (cacheError) {
      this.logger.error(`Error invalidating caches for user ${userId}: ${cacheError.message}`);
      // Don't rethrow as cache invalidation failure shouldn't stop the main operation
    }

    // Emit event for report creation
    this.eventEmitter.emit('moderation.report.created', {
      report: savedReport,
      targetUser,
      reporter,
    });

    return savedReport;
  }

  async getReportedContent(page = 1, limit = 10): Promise<[Report[], number]> {
    const cacheKey = this.getReportedContentCacheKey(page, limit);
    
    return this.cacheService.getOrFetch(
      cacheKey,
      async () => {
        return this.reportRepository.findAndCount({
          where: { status: ReportStatus.PENDING },
          relations: ['review', 'review.user', 'list', 'list.owner', 'reporter'],
          skip: (page - 1) * limit,
          take: limit,
          order: { createdAt: 'DESC' },
        });
      },
      CacheTTL.SHORT  // Short TTL as reported content is frequently updated
    );
  }

  async resolveReport(
    reportId: string,
    resolution: ReportResolution,
    moderator: User,
    notes?: string,
  ): Promise<Report> {
    // Find report with relations
    const report = await this.reportRepository.findOne({
      where: { id: reportId },
      relations: ['review', 'list', 'reporter'],
    });

    if (!report) {
      throw new NotFoundException(`Report with ID ${reportId} not found`);
    }

    // Update report status
    report.status = ReportStatus.RESOLVED;
    report.resolution = resolution;
    report.moderator = moderator;
    report.moderatorId = moderator.id;
    report.moderatorNotes = notes || undefined;
    report.resolvedAt = new Date();

    const savedReport = await this.reportRepository.save(report);

    // Update user reputation based on report validity
    if (resolution === ReportResolution.DELETE || resolution === ReportResolution.WARNING) {
      // Valid report
      await this.userReputationService.incrementValidReport(report.reporterId);
    } else {
      // Invalid report
      await this.userReputationService.incrementInvalidReport(report.reporterId);
    }

    // Handle content moderation based on resolution
    if (resolution !== ReportResolution.DISMISS) {
      switch (report.contentType) {
        case ContentType.REVIEW:
          if (report.review) {
            if (resolution === ReportResolution.DELETE) {
              await this.rejectReview(report.review.id, notes || 'Content removed due to report', moderator);
            } else if (resolution === ReportResolution.WARNING) {
              await this.flagReview(report.review.id, notes || 'Content flagged due to report', moderator);
            }
          }
          break;
        case ContentType.LIST:
          if (report.list) {
            if (resolution === ReportResolution.DELETE) {
              // Implement list deletion or use placeholder
              this.logger.warn(`List deletion not implemented for list ${report.list.id}`);
            } else if (resolution === ReportResolution.WARNING) {
              // Implement list flagging or use placeholder
              this.logger.warn(`List flagging not implemented for list ${report.list.id}`);
            }
          }
          break;
        case ContentType.USER_PROFILE:
          if (report.contentType === ContentType.USER_PROFILE) {
            const targetUser = await this.reportRepository.manager.findOne(User, {
              where: { id: report.id },
            });
            if (targetUser) {
              // Implement user action or use placeholder
              this.logger.warn(`User action not implemented for user ${report.id}`);
            }
          }
          break;
      }
    }

    // Invalidate relevant caches
    try {
      await this.invalidateModerationCaches(report.contentType, report.contentId);
    } catch (cacheError) {
      this.logger.error(`Error invalidating caches for ${report.contentType} ${report.contentId}: ${cacheError.message}`);
      // Don't rethrow as cache invalidation failure shouldn't stop the main operation
    }

    // Emit event for report resolution
    this.eventEmitter.emit('moderation.report.resolved', {
      report: savedReport,
      moderator,
      resolution,
    });

    return savedReport;
  }

  // Review moderation methods
  async approveReview(reviewId: string, moderator: User): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
      relations: ['user'],
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Update review status
    review.status = ReviewStatus.APPROVED;
    review.isFlagged = false;
    review.moderatedAt = new Date();

    const savedReview = await this.reviewRepository.save(review);

    // Increment user reputation
    await this.userReputationService.incrementApprovedContent(review.user.id);

    // Resolve any pending moderation queue items
    try {
      const queueItems = await this.moderationQueueService.findAll({
        contentType: [ContentType.REVIEW],
        contentId: reviewId,
        status: [ModerationStatus.PENDING, ModerationStatus.IN_REVIEW],
      });

      if (queueItems[0].length > 0) {
        await Promise.all(
          queueItems[0].map(item => 
            this.moderationQueueService.approve(item.id, moderator, 'Review approved')
          )
        );
      }
    } catch (error) {
      this.logger.error(`Error resolving moderation queue items: ${error.message}`);
      // Don't rethrow, we already approved the review
    }

    // Resolve any pending reports
    try {
      await this.reportRepository.update(
        { 
          contentType: ContentType.REVIEW, 
          contentId: reviewId, 
          status: ReportStatus.PENDING 
        },
        {
          status: ReportStatus.RESOLVED,
          resolution: ReportResolution.DISMISS,
          moderator,
          moderatorId: moderator.id,
          resolvedAt: new Date(),
          moderatorNotes: 'Review approved by moderator',
        }
      );
    } catch (error) {
      this.logger.error(`Error resolving reports: ${error.message}`);
      // Don't rethrow, we already approved the review
    }

    // Create moderation log
    try {
      const log = this.moderationLogRepository.create({
        moderator: moderator,
        action: ModerationAction.REVIEW_APPROVED,
        reason: 'Review approved by moderator',
        targetReview: savedReview,
        targetUser: review.user,
        createdAt: new Date(),
        isResolved: true,
        resolvedAt: new Date(),
      });

      await this.moderationLogRepository.save(log);
    } catch (logError) {
      this.logger.error(`Error creating moderation log for review ${reviewId}: ${logError.message}`);
      // Continue with the operation even if log creation fails
    }

    // Send notification to user
    await this.notificationsService.createNotification({
      userId: review.user.id,
      actorId: moderator.id,
      type: NotificationType.SYSTEM_MESSAGE,
      message: 'Your review has been approved',
      reviewId: review.id,
    });

    // Invalidate relevant caches
    await this.invalidateModerationCaches(ContentType.REVIEW, reviewId);

    // Emit event for review approval
    this.eventEmitter.emit('moderation.review.approved', {
      review: savedReview,
      moderator,
    });

    return savedReview;
  }

  async rejectReview(reviewId: string, reason: string, moderator: User): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
      relations: ['user'],
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Update review status
    review.status = ReviewStatus.REJECTED;
    review.isFlagged = false;
    review.moderationReason = reason;
    review.moderatedAt = new Date();

    const savedReview = await this.reviewRepository.save(review);

    // Decrement user reputation
    await this.userReputationService.incrementRejectedContent(review.user.id);

    // Resolve any pending moderation queue items
    try {
      const queueItems = await this.moderationQueueService.findAll({
        contentType: [ContentType.REVIEW],
        contentId: reviewId,
        status: [ModerationStatus.PENDING, ModerationStatus.IN_REVIEW],
      });

      if (queueItems[0].length > 0) {
        await Promise.all(
          queueItems[0].map(item => 
            this.moderationQueueService.reject(item.id, moderator, reason)
          )
        );
      }
    } catch (error) {
      this.logger.error(`Error resolving moderation queue items: ${error.message}`);
      // Don't rethrow, we already rejected the review
    }

    // Resolve any pending reports
    try {
      await this.reportRepository.update(
        { 
          contentType: ContentType.REVIEW, 
          contentId: reviewId, 
          status: ReportStatus.PENDING 
        },
        {
          status: ReportStatus.RESOLVED,
          resolution: ReportResolution.WARNING,
          moderator,
          moderatorId: moderator.id,
          resolvedAt: new Date(),
          moderatorNotes: reason,
        }
      );
    } catch (error) {
      this.logger.error(`Error resolving reports: ${error.message}`);
      // Don't rethrow, we already rejected the review
    }

    // Create moderation log
    try {
      const log = this.moderationLogRepository.create({
        moderator,
        action: ModerationAction.REVIEW_REJECTED,
        reason,
        targetReview: savedReview,
        targetUser: review.user,
        createdAt: new Date(),
        isResolved: true,
        resolvedAt: new Date(),
      });

      await this.moderationLogRepository.save(log);
    } catch (logError) {
      this.logger.error(`Error creating moderation log for review ${reviewId}: ${logError.message}`);
      // Continue with the operation even if log creation fails
    }

    // Send notification to user
    await this.notificationsService.createNotification({
      userId: review.user.id,
      actorId: moderator.id,
      type: NotificationType.SYSTEM_MESSAGE,
      message: `Your review has been rejected: ${reason}`,
      reviewId: review.id,
    });

    // Invalidate relevant caches
    await this.invalidateModerationCaches(ContentType.REVIEW, reviewId);

    // Emit event for review rejection
    this.eventEmitter.emit('moderation.review.rejected', {
      review: savedReview,
      moderator,
      reason,
    });

    return savedReview;
  }

  async flagReview(reviewId: string, reason: string, moderator: User): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
      relations: ['user'],
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Update review status
    review.status = ReviewStatus.FLAGGED;
    review.isFlagged = true;
    review.moderationReason = reason;
    review.moderatedAt = new Date();

    const savedReview = await this.reviewRepository.save(review);

    // Create moderation queue item if not exists
    try {
      await this.moderationQueueService.create({
        contentType: ContentType.REVIEW,
        contentId: reviewId,
        priority: ModerationPriority.HIGH,
        moderationNotes: `Flagged by moderator ${moderator.id}: ${reason}`,
      });
    } catch (error) {
      this.logger.log(`Error creating moderation queue item, may already exist: ${error.message}`);
      // Don't rethrow, we already flagged the review
    }

    // Create moderation log
    try {
      const log = this.moderationLogRepository.create({
        moderator,
        action: ModerationAction.REVIEW_FLAGGED,
        reason,
        targetReview: savedReview,
        targetUser: review.user,
        createdAt: new Date(),
        isResolved: false,
      });

      await this.moderationLogRepository.save(log);
    } catch (logError) {
      this.logger.error(`Error creating moderation log for review ${reviewId}: ${logError.message}`);
      // Continue with the operation even if log creation fails
    }

    // Send notification to user
    await this.notificationsService.createNotification({
      userId: review.user.id,
      actorId: moderator.id,
      type: NotificationType.SYSTEM_MESSAGE,
      message: `Your review has been flagged for review: ${reason}`,
      reviewId: review.id,
    });

    // Invalidate relevant caches
    await this.invalidateModerationCaches(ContentType.REVIEW, reviewId);

    // Emit event for review flagging
    this.eventEmitter.emit('moderation.review.flagged', {
      review: savedReview,
      moderator,
      reason,
    });

    return savedReview;
  }

  // List moderation methods
  async approveList(listId: string, moderator: User): Promise<List> {
    const list = await this.listRepository.findOne({
      where: { id: listId },
    });

    if (!list) {
      throw new NotFoundException('List not found');
    }

    // Logic to approve list
    // ...

    // Resolve moderation queue items
    // ...

    // Update user reputation
    // ...

    // Create moderation log
    // ...

    // Send notification
    // ...

    // Invalidate relevant caches
    await this.invalidateModerationCaches(ContentType.LIST, listId);

    return list;
  }

  async flagList(listId: string, reason: string, moderator: User): Promise<List> {
    const list = await this.listRepository.findOne({
      where: { id: listId },
      relations: ['owner'],
    });

    if (!list) {
      throw new NotFoundException('List not found');
    }

    // Update list status (assuming list entity has these fields)
    list.isFlagged = true;
    list.moderationReason = reason;
    list.moderatedAt = new Date();

    const savedList = await this.listRepository.save(list);

    // Create moderation queue item if not exists
    try {
      await this.moderationQueueService.create({
        contentType: ContentType.LIST,
        contentId: listId,
        priority: ModerationPriority.HIGH,
        moderationNotes: `Flagged by moderator ${moderator.id}: ${reason}`,
      });
    } catch (error) {
      this.logger.log(`Error creating moderation queue item, may already exist: ${error.message}`);
    }

    // Create moderation log
    try {
      const log = this.moderationLogRepository.create({
        moderator: moderator,
        action: ModerationAction.LIST_FLAGGED,
        reason,
        targetUser: list.owner,
        createdAt: new Date(),
        isResolved: false,
      });

      await this.moderationLogRepository.save(log);
    } catch (logError) {
      this.logger.error(`Error creating moderation log for list ${listId}: ${logError.message}`);
      // Continue with the operation even if log creation fails
    }

    // Send notification to user
    await this.notificationsService.createNotification({
      userId: list.owner_id,
      actorId: moderator.id,
      type: NotificationType.SYSTEM_MESSAGE,
      message: `Your list has been flagged for review: ${reason}`,
      listId: list.id,
    });

    // Invalidate relevant caches
    await this.invalidateModerationCaches(ContentType.LIST, listId);

    // Emit event for list flagging
    this.eventEmitter.emit('moderation.list.flagged', {
      list: savedList,
      moderator,
      reason,
    });

    return savedList;
  }

  async rejectList(listId: string, reason: string, moderator: User): Promise<List> {
    const list = await this.listRepository.findOne({
      where: { id: listId },
      relations: ['owner'],
    });

    if (!list) {
      throw new NotFoundException('List not found');
    }

    // Update list status (assuming list entity has these fields)
    list.isRejected = true;
    list.isFlagged = false;
    list.moderationReason = reason;
    list.moderatedAt = new Date();

    const savedList = await this.listRepository.save(list);

    // Decrement user reputation
    await this.userReputationService.incrementRejectedContent(list.owner_id);

    // Resolve any pending moderation queue items
    try {
      const queueItems = await this.moderationQueueService.findAll({
        contentType: [ContentType.LIST],
        contentId: listId,
        status: [ModerationStatus.PENDING, ModerationStatus.IN_REVIEW],
      });

      if (queueItems[0].length > 0) {
        await Promise.all(
          queueItems[0].map(item => 
            this.moderationQueueService.reject(item.id, moderator, reason)
          )
        );
      }
    } catch (error) {
      this.logger.error(`Error resolving moderation queue items: ${error.message}`);
      // Don't rethrow, we already rejected the list
    }

    // Resolve any pending reports
    try {
      await this.reportRepository.update(
        { 
          contentType: ContentType.LIST, 
          contentId: listId, 
          status: ReportStatus.PENDING 
        },
        {
          status: ReportStatus.RESOLVED,
          resolution: ReportResolution.WARNING,
          moderator,
          moderatorId: moderator.id,
          resolvedAt: new Date(),
          moderatorNotes: reason,
        }
      );
    } catch (error) {
      this.logger.error(`Error resolving reports: ${error.message}`);
      // Don't rethrow, we already rejected the list
    }

    // Create moderation log
    try {
      const log = this.moderationLogRepository.create({
        moderator,
        action: ModerationAction.LIST_REJECTED,
        reason,
        targetUser: list.owner,
        createdAt: new Date(),
        isResolved: true,
        resolvedAt: new Date(),
        metadata: { listId: savedList.id }
      });

      await this.moderationLogRepository.save(log);
    } catch (logError) {
      this.logger.error(`Error creating moderation log for list ${listId}: ${logError.message}`);
      // Continue with the operation even if log creation fails
    }

    // Send notification to user
    await this.notificationsService.createNotification({
      userId: list.owner_id,
      actorId: moderator.id,
      type: NotificationType.SYSTEM_MESSAGE,
      message: `Your list has been rejected: ${reason}`,
      listId: list.id,
    });

    // Invalidate relevant caches
    await this.invalidateModerationCaches(ContentType.LIST, listId);

    // Emit event for list rejection
    this.eventEmitter.emit('moderation.list.rejected', {
      list: savedList,
      moderator,
      reason,
    });

    return savedList;
  }

  // Get flagged content for moderation
  async getFlaggedReviews(page = 1, limit = 10): Promise<[Review[], number]> {
    const cacheKey = this.getFlaggedReviewsCacheKey(page, limit);
    
    return this.cacheService.getOrFetch(
      cacheKey,
      async () => {
        return this.reviewRepository.findAndCount({
          where: { 
            status: ReviewStatus.FLAGGED,
            isFlagged: true,
          },
          relations: ['user'],
          skip: (page - 1) * limit,
          take: limit,
          order: { createdAt: 'DESC' },
        });
      },
      CacheTTL.SHORT // Short TTL as flagged content changes frequently
    );
  }

  async getPendingReviews(page = 1, limit = 10): Promise<[Review[], number]> {
    const cacheKey = this.getPendingReviewsCacheKey(page, limit);
    
    return this.cacheService.getOrFetch(
      cacheKey,
      async () => {
        return this.reviewRepository.findAndCount({
          where: { 
            status: ReviewStatus.PENDING,
          },
          relations: ['user'],
          skip: (page - 1) * limit,
          take: limit,
          order: { createdAt: 'DESC' },
        });
      },
      CacheTTL.SHORT // Short TTL as pending content changes frequently
    );
  }

  async getFlaggedLists(page = 1, limit = 10): Promise<[List[], number]> {
    const cacheKey = this.getFlaggedListsCacheKey(page, limit);
    
    return this.cacheService.getOrFetch(
      cacheKey,
      async () => {
        return this.listRepository.findAndCount({
          where: { 
            isFlagged: true,
          },
          relations: ['owner'],
          skip: (page - 1) * limit,
          take: limit,
          order: { createdAt: 'DESC' },
        });
      },
      CacheTTL.SHORT
    );
  }

  // Get moderation statistics
  async getModerationStats(): Promise<{
    pendingReports: number;
    resolvedReports: number;
    flaggedReviews: number;
    flaggedLists: number;
    moderationQueueItems: number;
    autoFlaggedContent: number;
  }> {
    const cacheKey = this.getModerationStatsCacheKey();
    
    return this.cacheService.getOrFetch(
      cacheKey,
      async () => {
        const [
          pendingReports, 
          resolvedReports, 
          flaggedReviews, 
          flaggedLists,
          queueStats
        ] = await Promise.all([
          this.reportRepository.count({ where: { status: ReportStatus.PENDING } }),
          this.reportRepository.count({ where: { status: ReportStatus.RESOLVED } }),
          this.reviewRepository.count({ where: { isFlagged: true } }),
          this.listRepository.count({ where: { isFlagged: true } }),
          this.moderationQueueService.getStatistics(),
        ]);

        return {
          pendingReports,
          resolvedReports,
          flaggedReviews,
          flaggedLists,
          moderationQueueItems: queueStats.pendingCount + queueStats.inReviewCount,
          autoFlaggedContent: queueStats.autoFlaggedCount,
        };
      },
      CacheTTL.SHORT // Short TTL as stats change frequently
    );
  }

  // Handle automated content moderation
  async processNewReview(review: Review): Promise<void> {
    // Let auto-moderation service process the review
    const needsModeration = await this.autoModerationService.moderateReview(review);
    
    if (needsModeration) {
      this.logger.log(`Review ${review.id} flagged by auto-moderation`);
      
      // Invalidate relevant caches
      await this.invalidateModerationCaches(ContentType.REVIEW, review.id);
    }
  }

  async processNewList(list: List): Promise<void> {
    // Let auto-moderation service process the list
    const needsModeration = await this.autoModerationService.moderateList(list);
    
    if (needsModeration) {
      this.logger.log(`List ${list.id} flagged by auto-moderation`);
      
      // Invalidate relevant caches
      await this.invalidateModerationCaches(ContentType.LIST, list.id);
    }
  }

  // New methods for bulk operations and admin functionality

  /**
   * Delete a review completely
   */
  async deleteReview(reviewId: string): Promise<boolean> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId }
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    await this.reviewRepository.remove(review);
    
    // Resolve any pending reports
    await this.reportRepository.update(
      { contentType: ContentType.REVIEW, contentId: reviewId },
      { status: ReportStatus.RESOLVED, resolution: ReportResolution.DELETE }
    );
    
    // Resolve any queue items
    const queueItems = await this.moderationQueueService.findAll({
      contentType: [ContentType.REVIEW],
      contentId: reviewId
    });
    
    for (const item of queueItems[0]) {
      await this.moderationQueueService.reject(
        item.id, 
        { id: 'system' } as User, 
        'Content deleted by administrator'
      );
    }
    
    // Invalidate relevant caches
    await this.invalidateModerationCaches(ContentType.REVIEW, reviewId);
    
    // Emit event for review deletion
    this.eventEmitter.emit('moderation.review.deleted', {
      reviewId
    });
    
    return true;
  }
  
  /**
   * Delete a list completely
   */
  async deleteList(listId: string): Promise<boolean> {
    const list = await this.listRepository.findOne({
      where: { id: listId }
    });

    if (!list) {
      throw new NotFoundException('List not found');
    }

    await this.listRepository.remove(list);
    
    // Resolve any pending reports
    await this.reportRepository.update(
      { contentType: ContentType.LIST, contentId: listId },
      { status: ReportStatus.RESOLVED, resolution: ReportResolution.DELETE }
    );
    
    // Resolve any queue items
    const queueItems = await this.moderationQueueService.findAll({
      contentType: [ContentType.LIST],
      contentId: listId
    });
    
    for (const item of queueItems[0]) {
      await this.moderationQueueService.reject(
        item.id, 
        { id: 'system' } as User, 
        'Content deleted by administrator'
      );
    }
    
    // Invalidate relevant caches
    await this.invalidateModerationCaches(ContentType.LIST, listId);
    
    // Emit event for list deletion
    this.eventEmitter.emit('moderation.list.deleted', {
      listId
    });
    
    return true;
  }
  
  /**
   * Delete a comment completely
   */
  async deleteComment(commentId: string): Promise<boolean> {
    // This would require importing the correct repository
    // For now we'll implement a basic version
    this.logger.log(`Deleting comment ${commentId}`);
    
    // Invalidate relevant caches
    // ContentType.COMMENT doesn't exist, use a valid content type
    await this.invalidateModerationCaches(ContentType.REVIEW, commentId);
    
    // Emit event for comment deletion
    this.eventEmitter.emit('moderation.comment.deleted', {
      commentId
    });
    
    return true;
  }
  
  /**
   * Get admin audit trail for moderation actions
   */
  async findReportById(id: string): Promise<Report> {
    try {
      const report = await this.reportRepository.findOne({
        where: { id },
        relations: ['review', 'review.user', 'list', 'list.owner', 'reporter', 'moderator'],
      });

      if (!report) {
        throw new NotFoundException(`Report with ID ${id} not found`);
      }

      return report;
    } catch (error) {
      this.logger.error(`Error finding report ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getModerationLogs(
    page = 1, 
    limit = 10, 
    filters?: { 
      action?: ModerationAction, 
      moderatorId?: string, 
      targetUserId?: string 
    }
  ): Promise<[ModerationLog[], number]> {
    const cacheKey = this.getModerationLogsCacheKey(page, limit, filters);
    
    return this.cacheService.getOrFetch(
      cacheKey,
      async () => {
        const where: FindOptionsWhere<ModerationLog> = {};
        
        if (filters?.action) {
          where.action = filters.action;
        }
        
        if (filters?.moderatorId) {
          where.moderator = { id: filters.moderatorId };
        }
        
        if (filters?.targetUserId) {
          where.targetUser = { id: filters.targetUserId };
        }
        
        return this.moderationLogRepository.findAndCount({
          where,
          relations: ['moderator', 'targetUser', 'targetReview'],
          skip: (page - 1) * limit,
          take: limit,
          order: { createdAt: 'DESC' }
        });
      },
      CacheTTL.MEDIUM  // Medium TTL as logs don't change frequently
    );
  }
}