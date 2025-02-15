// src/modules/notifications/notifications.service.ts
import { Injectable } from '@nestjs/common';
import { Review } from '../reviews/entities/review.entity';
import { User } from '../users/entities/user.entity';
import { ReactionType } from '../reviews/entities/review-reaction.entity';

@Injectable()
export class NotificationsService {
  async notifyReviewReaction(review: Review, user: User, type: ReactionType): Promise<void> {
    // TODO: Implement notification logic
    console.log(`User ${user.id} reacted with ${type} to review ${review.id}`);
  }

  async notifyReviewComment(review: Review, user: User, comment: string): Promise<void> {
    // TODO: Implement notification logic
    console.log(`User ${user.id} commented on review ${review.id}: ${comment}`);
  }
}