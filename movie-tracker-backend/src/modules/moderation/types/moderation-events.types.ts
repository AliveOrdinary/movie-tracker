// src/modules/moderation/types/moderation-events.types.ts
import { Review } from '../../reviews/entities/review.entity';
import { List } from '../../lists/entities/list.entity';
import { User } from '../../users/entities/user.entity';
import { Report } from '../entities/report.entity';
import { ModerationQueue, ContentType } from '../entities/moderation-queue.entity';
import { AutoModerationRule } from '../entities/auto-moderation-rule.entity';
import { ReportResolution } from '../../../common/enums';

/**
 * Event payload when a report is created
 */
export interface ReportCreatedEvent {
  report: Report;
  review?: Review;
  list?: List;
  targetUser?: User;
  reporter: User;
  timestamp: Date;
}

/**
 * Event payload when a report is resolved
 */
export interface ReportResolvedEvent {
  report: Report;
  moderator: User;
  resolution: ReportResolution;
  timestamp: Date;
}

/**
 * Event payload when a review is approved
 */
export interface ReviewApprovedEvent {
  review: Review;
  moderator: User;
  timestamp: Date;
}

/**
 * Event payload when a review is rejected
 */
export interface ReviewRejectedEvent {
  review: Review;
  moderator: User;
  reason: string;
  timestamp: Date;
}

/**
 * Event payload when a review is flagged
 */
export interface ReviewFlaggedEvent {
  review: Review;
  moderator: User;
  reason: string;
  timestamp: Date;
}

/**
 * Event payload when a list is approved
 */
export interface ListApprovedEvent {
  list: List;
  moderator: User;
  timestamp: Date;
}

/**
 * Event payload when a list is rejected
 */
export interface ListRejectedEvent {
  list: List;
  moderator: User;
  reason: string;
  timestamp: Date;
}

/**
 * Event payload when a list is flagged
 */
export interface ListFlaggedEvent {
  list: List;
  moderator: User;
  reason: string;
  timestamp: Date;
}

/**
 * Event payload when content is auto-flagged
 */
export interface AutoFlaggedEvent {
  contentType: ContentType;
  content: Review | List | User;
  rules: AutoModerationRule[];
  timestamp: Date;
}

/**
 * Event payload when a moderation queue item is updated
 */
export interface QueueItemUpdatedEvent {
  queueItem: ModerationQueue;
  previousStatus: string;
  updatedBy: User;
  timestamp: Date;
}

/**
 * Event names used throughout the moderation system
 */
export enum ModerationEvents {
  REPORT_CREATED = 'moderation.report.created',
  REPORT_RESOLVED = 'moderation.report.resolved',
  REVIEW_APPROVED = 'moderation.review.approved',
  REVIEW_REJECTED = 'moderation.review.rejected',
  REVIEW_FLAGGED = 'moderation.review.flagged',
  LIST_APPROVED = 'moderation.list.approved',
  LIST_REJECTED = 'moderation.list.rejected',
  LIST_FLAGGED = 'moderation.list.flagged',
  AUTO_FLAGGED = 'moderation.auto.flagged',
  QUEUE_ITEM_UPDATED = 'moderation.queue.updated'
}