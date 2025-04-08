// src/modules/moderation/services/moderation-queue.service.ts
import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, In, Between, LessThan, MoreThan } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ModerationQueue, ContentType, ModerationStatus, ModerationPriority } from '../entities/moderation-queue.entity';
import { User } from '../../users/entities/user.entity';
import { Review } from '../../reviews/entities/review.entity';
import { List } from '../../lists/entities/list.entity';
import { Report } from '../entities/report.entity';
import { CreateModerationQueueItemInput, UpdateModerationQueueItemInput } from '../dto/moderation-queue.dto';
import { ReportResolution, ReportStatus, ReviewStatus } from 'src/common/enums';
import { CacheService } from '../../../common/services/cache.service';
import { CacheKeyFactory } from '../../../common/factories/cache-key.factory';
import { CacheTTL } from '../../../common/constants/cache-ttl.constants';

@Injectable()
export class ModerationQueueService {
  private readonly logger = new Logger(ModerationQueueService.name);

  constructor(
    @InjectRepository(ModerationQueue)
    private moderationQueueRepository: Repository<ModerationQueue>,
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(List)
    private listRepository: Repository<List>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Report)
    private reportRepository: Repository<Report>,
    private readonly cacheService: CacheService,
    protected readonly cacheKeyFactory: CacheKeyFactory,
    private eventEmitter: EventEmitter2,
  ) {}

  // Cache key helpers
  private getQueueItemCacheKey(id: string): string {
    return this.cacheKeyFactory.generate('moderation', 'queueItem', [id]);
  }

  private getQueueFilterCacheKey(filters: any): string {
    return this.cacheKeyFactory.generate('moderation', 'queue', [
      JSON.stringify({
        status: filters.status || [],
        priority: filters.priority || [],
        contentType: filters.contentType || [],
        assignedToId: filters.assignedToId,
        moderatedById: filters.moderatedById,
        isAutoFlagged: filters.isAutoFlagged,
        page: filters.page || 1,
        limit: filters.limit || 10,
        sortBy: 'priority',
        sortDirection: 'DESC'
      })
    ]);
  }

  private getNextItemCacheKey(moderatorId: string): string {
    return this.cacheKeyFactory.generate('moderation', 'nextItem', [moderatorId]);
  }

  private getStatisticsCacheKey(): string {
    return this.cacheKeyFactory.generate('moderation', 'queueStats');
  }

  /**
   * Invalidate queue-related caches
   */
  private async invalidateQueueCaches(): Promise<void> {
    try {
      // Invalidate all queue-related caches
      await Promise.all([
        this.cacheService.invalidatePattern('moderation:queue:*'),
        this.cacheService.invalidatePattern('moderation:nextItem:*'),
        this.cacheService.invalidatePattern('moderation:queueStats')
      ]);

      this.logger.log('Invalidated moderation queue caches');
    } catch (error) {
      this.logger.error(`Error invalidating moderation queue caches: ${error.message}`);
    }
  }

  /**
   * Invalidate a specific queue item's cache
   */
  private async invalidateQueueItemCache(id: string): Promise<void> {
    try {
      await this.cacheService.invalidate(this.getQueueItemCacheKey(id));
    } catch (error) {
      this.logger.error(`Error invalidating queue item cache: ${error.message}`);
    }
  }

  async create(input: CreateModerationQueueItemInput): Promise<ModerationQueue> {
    // Check if item already exists in queue
    const existing = await this.moderationQueueRepository.findOne({
      where: {
        contentType: input.contentType,
        contentId: input.contentId,
        status: In([ModerationStatus.PENDING, ModerationStatus.IN_REVIEW]),
      },
    });

    if (existing) {
      // Update report count instead of creating a new item
      existing.reportCount++;
      
      // Escalate priority if needed
      if (
        (existing.priority === ModerationPriority.LOW && existing.reportCount > 1) ||
        (existing.priority === ModerationPriority.MEDIUM && existing.reportCount > 3) ||
        (existing.priority === ModerationPriority.HIGH && existing.reportCount > 5)
      ) {
        existing.priority = this.escalatePriority(existing.priority);
      }

      // Append moderation notes if provided
      if (input.moderationNotes) {
        existing.moderationNotes = existing.moderationNotes 
          ? `${existing.moderationNotes}\n---\n${input.moderationNotes}`
          : input.moderationNotes;
      }
      
      const updated = await this.moderationQueueRepository.save(existing);
      
      // Invalidate caches
      await Promise.all([
        this.invalidateQueueItemCache(updated.id),
        this.invalidateQueueCaches()
      ]);
      
      return updated;
    }

    // Create new queue item
    const queueItem = this.moderationQueueRepository.create({
      ...input,
      reportCount: 1,
      priority: input.priority || ModerationPriority.MEDIUM,
      status: ModerationStatus.PENDING,
    });

    // Set relationships based on content type
    if (input.contentType === ContentType.REVIEW) {
      const review = await this.reviewRepository.findOne({
        where: { id: input.contentId },
        relations: ['user'],
      });

      if (!review) {
        throw new NotFoundException(`Review with ID ${input.contentId} not found`);
      }

      queueItem.review = review;
      queueItem.targetUserId = review.user.id;
      
      // Update review status to FLAGGED if not already
      if (review.status !== ReviewStatus.FLAGGED) {
        review.status = ReviewStatus.FLAGGED;
        review.isFlagged = true;
        await this.reviewRepository.save(review);
      }
    } else if (input.contentType === ContentType.LIST) {
      const list = await this.listRepository.findOne({
        where: { id: input.contentId },
      });

      if (!list) {
        throw new NotFoundException(`List with ID ${input.contentId} not found`);
      }

      queueItem.list = list;
      queueItem.targetUserId = list.owner_id;
    } else if (input.contentType === ContentType.USER_PROFILE) {
      const user = await this.userRepository.findOne({
        where: { id: input.contentId },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${input.contentId} not found`);
      }

      queueItem.targetUser = user;
      queueItem.targetUserId = user.id;
    }

    const savedItem = await this.moderationQueueRepository.save(queueItem);
    
    // Invalidate caches
    await this.invalidateQueueCaches();
    
    // Emit event for moderation queue item creation
    this.eventEmitter.emit('moderation.queue.created', savedItem);
    
    return savedItem;
  }

  async findOne(id: string): Promise<ModerationQueue> {
    const cacheKey = this.getQueueItemCacheKey(id);
    
    return this.cacheService.getOrFetch(
      cacheKey,
      async () => {
        const queueItem = await this.moderationQueueRepository.findOne({
          where: { id },
          relations: ['review', 'list', 'targetUser', 'assignedTo', 'moderatedBy'],
        });

        if (!queueItem) {
          throw new NotFoundException(`Moderation queue item with ID ${id} not found`);
        }

        return queueItem;
      },
      CacheTTL.SHORT // Short TTL as queue items change frequently
    );
  }

  async findAll(filters: any): Promise<[ModerationQueue[], number]> {
    const cacheKey = this.getQueueFilterCacheKey(filters);
    
    return this.cacheService.getOrFetch(
      cacheKey,
      async () => {
        const {
          status,
          priority,
          contentType,
          assignedToId,
          moderatedById,
          isAutoFlagged,
          page = 1,
          limit = 10,
        } = filters;
        
        // Hard-code the sort values
        const sortBy = 'priority';
        const sortDirection = 'DESC';

        const queryBuilder = this.moderationQueueRepository.createQueryBuilder('queue')
          .leftJoinAndSelect('queue.review', 'review')
          .leftJoinAndSelect('queue.list', 'list')
          .leftJoinAndSelect('queue.targetUser', 'targetUser')
          .leftJoinAndSelect('queue.assignedTo', 'assignedTo')
          .leftJoinAndSelect('queue.moderatedBy', 'moderatedBy');

        // Apply filters
        if (status && status.length > 0) {
          queryBuilder.andWhere('queue.status IN (:...status)', { status });
        }

        if (priority && priority.length > 0) {
          queryBuilder.andWhere('queue.priority IN (:...priority)', { priority });
        }

        if (contentType && contentType.length > 0) {
          queryBuilder.andWhere('queue.contentType IN (:...contentType)', { contentType });
        }

        if (assignedToId) {
          queryBuilder.andWhere('queue.assignedToId = :assignedToId', { assignedToId });
        }

        if (moderatedById) {
          queryBuilder.andWhere('queue.moderatedById = :moderatedById', { moderatedById });
        }

        if (typeof isAutoFlagged === 'boolean') {
          queryBuilder.andWhere('queue.isAutoFlagged = :isAutoFlagged', { isAutoFlagged });
        }

        // Sort by appropriate field with specified direction
        queryBuilder.orderBy(`queue.${sortBy}`, sortDirection as 'ASC' | 'DESC');

        // Add secondary sorting by creation date to ensure consistent ordering
        queryBuilder.addOrderBy('queue.createdAt', 'DESC');

        // Apply pagination
        queryBuilder
          .skip((page - 1) * limit)
          .take(limit);

        return queryBuilder.getManyAndCount();
      },
      CacheTTL.SHORT // Short TTL as queue items change frequently
    );
  }

  async update(id: string, input: UpdateModerationQueueItemInput, moderator?: User): Promise<ModerationQueue> {
    const queueItem = await this.findOne(id);
    const originalStatus = queueItem.status;

    // Update fields from input
    if (typeof input.status !== 'undefined') {
      queueItem.status = input.status;
      
      // If transitioning to IN_REVIEW, set assignedTo if not already set
      if (input.status === ModerationStatus.IN_REVIEW && !queueItem.assignedToId && moderator) {
        queueItem.assignedTo = moderator;
        queueItem.assignedToId = moderator.id;
        queueItem.assignedAt = new Date();
      }
      
      // If transitioning to a resolved state, set moderatedBy
      if (
        (input.status === ModerationStatus.APPROVED || 
        input.status === ModerationStatus.REJECTED || 
        input.status === ModerationStatus.DELETED) && 
        moderator
      ) {
        queueItem.moderatedBy = moderator;
        queueItem.moderatedById = moderator.id;
        queueItem.moderatedAt = new Date();
      }
    }

    if (typeof input.priority !== 'undefined') {
      queueItem.priority = input.priority;
    }

    if (typeof input.assignedToId !== 'undefined') {
      if (input.assignedToId) {
        const user = await this.userRepository.findOne({
          where: { id: input.assignedToId },
        });
        
        if (!user) {
          throw new NotFoundException(`User with ID ${input.assignedToId} not found`);
        }
        
        queueItem.assignedTo = user;
        queueItem.assignedToId = user.id;
        queueItem.assignedAt = new Date();
      } else {
        // Unassign
        queueItem.assignedTo = undefined;
        queueItem.assignedToId = undefined;
        queueItem.assignedAt = undefined;
      }
    }

    if (typeof input.moderationNotes !== 'undefined') {
      queueItem.moderationNotes = input.moderationNotes;
    }

    const updated = await this.moderationQueueRepository.save(queueItem);

    // Process status changes - update underlying content
    if (originalStatus !== updated.status) {
      await this.processStatusChange(updated, originalStatus);
    }

    // Invalidate caches
    await Promise.all([
      this.invalidateQueueItemCache(updated.id),
      this.invalidateQueueCaches()
    ]);

    // Emit event for status update
    this.eventEmitter.emit('moderation.queue.updated', updated);

    return updated;
  }

  async assignToModerator(id: string, moderatorId: string): Promise<ModerationQueue> {
    const moderator = await this.userRepository.findOne({
      where: { id: moderatorId },
    });

    if (!moderator) {
      throw new NotFoundException(`Moderator with ID ${moderatorId} not found`);
    }

    return this.update(id, {
      id,
      status: ModerationStatus.IN_REVIEW,
      assignedToId: moderatorId,
    });
  }

  async unassign(id: string): Promise<ModerationQueue> {
    return this.update(id, {
      id,
      assignedToId: undefined,
      status: ModerationStatus.PENDING,
    });
  }

  async approve(id: string, moderator: User, notes?: string): Promise<ModerationQueue> {
    return this.update(
      id, 
      {
        id,
        status: ModerationStatus.APPROVED,
        moderationNotes: notes,
      },
      moderator
    );
  }

  async reject(id: string, moderator: User, notes?: string): Promise<ModerationQueue> {
    return this.update(
      id, 
      {
        id,
        status: ModerationStatus.REJECTED,
        moderationNotes: notes,
      },
      moderator
    );
  }

  async delete(id: string, moderator: User, notes?: string): Promise<ModerationQueue> {
    return this.update(
      id, 
      {
        id,
        status: ModerationStatus.DELETED,
        moderationNotes: notes,
      },
      moderator
    );
  }

  async getNextItemForModeration(moderator: User): Promise<ModerationQueue | null> {
    const cacheKey = this.getNextItemCacheKey(moderator.id);
    
    return this.cacheService.getOrFetch(
      cacheKey,
      async () => {
        // First try to get items already assigned to this moderator
        const assignedItems = await this.moderationQueueRepository.find({
          where: {
            assignedToId: moderator.id,
            status: ModerationStatus.IN_REVIEW,
          },
          order: {
            priority: 'DESC',
            createdAt: 'ASC',
          },
          take: 1,
        });

        if (assignedItems.length > 0) {
          return assignedItems[0];
        }

        // Get next item by priority
        const pendingItems = await this.moderationQueueRepository.find({
          where: {
            status: ModerationStatus.PENDING,
            assignedToId: undefined,
          },
          order: {
            priority: 'DESC',
            createdAt: 'ASC',
          },
          take: 1,
        });

        if (pendingItems.length === 0) {
          return null;
        }

        // Assign to moderator
        const item = pendingItems[0];
        return this.assignToModerator(item.id, moderator.id);
      },
      CacheTTL.SHORT // Short TTL as next item changes frequently
    );
  }

  async getStatistics(): Promise<{
    pendingCount: number;
    inReviewCount: number;
    todayResolvedCount: number;
    totalResolvedCount: number;
    autoFlaggedCount: number;
    averageResolutionTimeMinutes: number;
  }> {
    const cacheKey = this.getStatisticsCacheKey();
    
    return this.cacheService.getOrFetch(
      cacheKey,
      async () => {
        // Get today's date at midnight
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [
          pendingCount,
          inReviewCount,
          todayResolvedCount,
          totalResolvedCount,
          autoFlaggedCount,
          averageResolutionTime,
        ] = await Promise.all([
          // Pending count
          this.moderationQueueRepository.count({
            where: { status: ModerationStatus.PENDING },
          }),
          
          // In review count
          this.moderationQueueRepository.count({
            where: { status: ModerationStatus.IN_REVIEW },
          }),
          
          // Today's resolved count
          this.moderationQueueRepository.count({
            where: {
              status: In([ModerationStatus.APPROVED, ModerationStatus.REJECTED, ModerationStatus.DELETED]),
              moderatedAt: MoreThan(today),
            },
          }),
          
          // Total resolved count
          this.moderationQueueRepository.count({
            where: {
              status: In([ModerationStatus.APPROVED, ModerationStatus.REJECTED, ModerationStatus.DELETED]),
            },
          }),
          
          // Auto-flagged count
          this.moderationQueueRepository.count({
            where: { isAutoFlagged: true },
          }),
          
          // Average resolution time
          this.moderationQueueRepository
            .createQueryBuilder('queue')
            .select('AVG(EXTRACT(EPOCH FROM (queue.moderatedAt - queue.createdAt)) / 60)', 'avgTime')
            .where('queue.status IN (:...statuses)', { 
              statuses: [ModerationStatus.APPROVED, ModerationStatus.REJECTED, ModerationStatus.DELETED] 
            })
            .andWhere('queue.moderatedAt IS NOT NULL')
            .getRawOne()
            .then(result => parseFloat(result?.avgTime || '0')),
        ]);

        return {
          pendingCount,
          inReviewCount,
          todayResolvedCount,
          totalResolvedCount,
          autoFlaggedCount,
          averageResolutionTimeMinutes: Math.round(averageResolutionTime),
        };
      },
      CacheTTL.SHORT // Short TTL as stats change frequently
    );
  }

  // Helper methods
  private escalatePriority(currentPriority: ModerationPriority): ModerationPriority {
    switch (currentPriority) {
      case ModerationPriority.LOW:
        return ModerationPriority.MEDIUM;
      case ModerationPriority.MEDIUM:
        return ModerationPriority.HIGH;
      case ModerationPriority.HIGH:
        return ModerationPriority.URGENT;
      case ModerationPriority.URGENT:
        return ModerationPriority.URGENT;
      default:
        return currentPriority;
    }
  }

  private async processStatusChange(item: ModerationQueue, previousStatus: ModerationStatus): Promise<void> {
    try {
      // Handle content updates based on moderation decisions
      if (item.contentType === ContentType.REVIEW && item.review) {
        switch (item.status) {
          case ModerationStatus.APPROVED:
            await this.reviewRepository.update(item.review.id, {
              status: ReviewStatus.APPROVED,
              isFlagged: false,
            });
            break;
            
          case ModerationStatus.REJECTED:
            await this.reviewRepository.update(item.review.id, {
              status: ReviewStatus.REJECTED,
              isFlagged: false,
            });
            break;
            
          case ModerationStatus.DELETED:
            await this.reviewRepository.softDelete(item.review.id);
            break;
        }
      } else if (item.contentType === ContentType.USER_PROFILE && item.targetUser) {
        switch (item.status) {
          case ModerationStatus.REJECTED:
            // Warn the user
            await this.userRepository.update(item.targetUser.id, {
              warningCount: () => 'warning_count + 1',
              lastWarningReason: item.moderationNotes,
              lastWarningAt: new Date(),
            });
            break;
            
          case ModerationStatus.DELETED:
            // Ban the user
            await this.userRepository.update(item.targetUser.id, {
              isBanned: true,
              banReason: item.moderationNotes,
              bannedAt: new Date(),
            });
            break;
        }
      }

      // Update any associated reports
      if (
        item.status === ModerationStatus.APPROVED ||
        item.status === ModerationStatus.REJECTED ||
        item.status === ModerationStatus.DELETED
      ) {
        await this.reportRepository.update(
          { 
            contentType: item.contentType,
            contentId: item.contentId,
            status: ReportStatus.PENDING,
          },
          {
            status: ReportStatus.RESOLVED,
            resolution: this.mapModerationStatusToResolution(item.status),
            moderatorId: item.moderatedById,
            resolvedAt: new Date(),
            moderatorNotes: item.moderationNotes,
          }
        );
      }
    } catch (error) {
      this.logger.error(`Error processing status change for moderation item ${item.id}:`, error);
      // Don't rethrow, as we don't want to fail the entire moderation update
    }
  }

  private mapModerationStatusToResolution(status: ModerationStatus): ReportResolution {
    switch (status) {
      case ModerationStatus.APPROVED:
        return ReportResolution.DISMISS;
      case ModerationStatus.REJECTED:
        return ReportResolution.WARNING;
      case ModerationStatus.DELETED:
        return ReportResolution.DELETE;
      default:
        return ReportResolution.DISMISS;
    }
  }
}