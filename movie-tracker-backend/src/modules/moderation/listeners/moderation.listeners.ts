// src/modules/moderation/listeners/moderation.listeners.ts
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Review } from '../../reviews/entities/review.entity';
import { List } from '../../lists/entities/list.entity';
import { Report } from '../entities/report.entity';
import { ModerationLog } from '../entities/moderation-log.entity';
import { ModerationQueue, ContentType } from '../entities/moderation-queue.entity';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType } from '../../notifications/entities/notification.entity';
import { ModerationAction, ReportResolution, UserRole } from '../../../common/enums';

@Injectable()
export class ModerationEventListeners {
  private readonly logger = new Logger(ModerationEventListeners.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(ModerationLog)
    private moderationLogRepository: Repository<ModerationLog>,
    private readonly notificationsService: NotificationsService,
  ) {}

  @OnEvent('moderation.report.created')
  async handleReportCreated(payload: { report: Report; review?: Review; list?: List; targetUser?: User; reporter: User }) {
    this.logger.log(`Report created: ${payload.report.id}`);

    // Notify moderators about new report
    const moderators = await this.userRepository.find({
      where: { roles: In([UserRole.MODERATOR, UserRole.ADMIN]) }
    });

    // Only notify the first few moderators to avoid spam
    for (const moderator of moderators.slice(0, 3)) {
      await this.notificationsService.createNotification({
        userId: moderator.id,
        type: NotificationType.SYSTEM_MESSAGE,
        message: `New content reported: ${payload.report.reason.substring(0, 50)}${payload.report.reason.length > 50 ? '...' : ''}`,
        metadata: {
          reportId: payload.report.id,
          contentType: payload.report.contentType,
          contentId: payload.report.contentId
        }
      });
    }

    const log = this.moderationLogRepository.create({
      action: ModerationAction.REVIEW_FLAGGED,
      reason: payload.report.reason,
      moderator: payload.reporter,
      targetReview: payload.review,
      targetUser: payload.targetUser || (payload.review?.user), // Use optional chaining
      createdAt: new Date(),
      isResolved: false,
      metadata: {
        reportId: payload.report.id,
        reporterUsername: payload.reporter.username
      }
    });
    // Create moderation log
    await this.moderationLogRepository.save(log);
  }

  @OnEvent('moderation.report.resolved')
  async handleReportResolved(payload: { report: Report; moderator: User; resolution: ReportResolution }) {
    this.logger.log(`Report resolved: ${payload.report.id} with resolution ${payload.resolution}`);

    // Notify reporter about resolution
    await this.notificationsService.createNotification({
      userId: payload.report.reporterId,
      actorId: payload.moderator.id,
      type: NotificationType.SYSTEM_MESSAGE,
      message: `Your report has been reviewed and ${this.getResolutionMessage(payload.resolution)}`,
      metadata: {
        reportId: payload.report.id,
        resolution: payload.resolution
      }
    });

    // Update moderation log if exists
    const log = await this.moderationLogRepository.findOne({
      where: {
        metadata: {
          reportId: payload.report.id
        }
      }
    });

    if (log) {
      log.isResolved = true;
      log.resolvedAt = new Date();
      log.notes = payload.report.moderatorNotes;
      await this.moderationLogRepository.save(log);
    }
  }

  @OnEvent('moderation.review.approved')
  async handleReviewApproved(payload: { review: Review; moderator: User }) {
    this.logger.log(`Review approved: ${payload.review.id}`);

    // Notify the content creator
    await this.notificationsService.createNotification({
      userId: payload.review.user.id,
      actorId: payload.moderator.id,
      type: NotificationType.SYSTEM_MESSAGE,
      message: 'Your review has been approved',
      reviewId: payload.review.id
    });
  }

  @OnEvent('moderation.review.rejected')
  async handleReviewRejected(payload: { review: Review; moderator: User; reason: string }) {
    this.logger.log(`Review rejected: ${payload.review.id}`);

    // Notify the content creator
    await this.notificationsService.createNotification({
      userId: payload.review.user.id,
      actorId: payload.moderator.id,
      type: NotificationType.SYSTEM_MESSAGE,
      message: `Your review has been rejected: ${payload.reason}`,
      reviewId: payload.review.id
    });
  }

  @OnEvent('moderation.review.flagged')
  async handleReviewFlagged(payload: { review: Review; moderator: User; reason: string }) {
    this.logger.log(`Review flagged: ${payload.review.id}`);

    // Notify the content creator
    await this.notificationsService.createNotification({
      userId: payload.review.user.id,
      actorId: payload.moderator.id,
      type: NotificationType.SYSTEM_MESSAGE,
      message: `Your review has been flagged for moderation: ${payload.reason}`,
      reviewId: payload.review.id
    });

    // Notify other moderators
    const moderators = await this.userRepository.find({
      where: { roles: In([UserRole.MODERATOR, UserRole.ADMIN]) }
    });

    for (const mod of moderators.filter(m => m.id !== payload.moderator.id).slice(0, 3)) {
      await this.notificationsService.createNotification({
        userId: mod.id,
        actorId: payload.moderator.id,
        type: NotificationType.SYSTEM_MESSAGE,
        message: `Review flagged by ${payload.moderator.username}: ${payload.reason.substring(0, 50)}${payload.reason.length > 50 ? '...' : ''}`,
        reviewId: payload.review.id
      });
    }
  }

  @OnEvent('moderation.auto.flagged')
  async handleAutoFlagged(payload: { contentType: ContentType; content: any; rules: any[] }) {
    this.logger.log(`Content auto-flagged: ${payload.contentType} ${payload.content.id}`);

    // Notify moderators about auto-flagged content
    const moderators = await this.userRepository.find({
      where: { roles: In([UserRole.MODERATOR, UserRole.ADMIN]) }
    });

    const contentTypeMap = {
      [ContentType.REVIEW]: 'Review',
      [ContentType.LIST]: 'List',
      [ContentType.USER_PROFILE]: 'User profile'
    };

    const rulesText = payload.rules.map(r => r.name).join(', ');

    for (const moderator of moderators.slice(0, 3)) {
      await this.notificationsService.createNotification({
        userId: moderator.id,
        type: NotificationType.SYSTEM_MESSAGE,
        message: `${contentTypeMap[payload.contentType]} auto-flagged by rules: ${rulesText}`,
        metadata: {
          contentType: payload.contentType,
          contentId: payload.content.id,
          rules: payload.rules.map(r => r.id)
        }
      });
    }
  }

  @OnEvent('moderation.queue.updated')
  async handleQueueItemUpdated(payload: ModerationQueue) {
    this.logger.log(`Moderation queue item updated: ${payload.id}, status: ${payload.status}`);
  }

  // Helper method to generate appropriate resolution messages
  private getResolutionMessage(resolution: ReportResolution): string {
    switch (resolution) {
      case ReportResolution.DISMISS:
        return 'dismissed - no action was taken';
      case ReportResolution.WARNING:
        return 'confirmed - the content creator has been warned';
      case ReportResolution.DELETE:
        return 'confirmed - the reported content has been removed';
      default:
        return 'processed';
    }
  }
}