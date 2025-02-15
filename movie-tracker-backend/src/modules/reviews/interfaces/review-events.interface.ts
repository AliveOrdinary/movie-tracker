// src/modules/reviews/interfaces/review-events.interface.ts
import { ReviewEventType } from '../events/review.events';
import { Review } from '../entities/review.entity';
import { User } from '../../users/entities/user.entity';

export interface ReviewEvent {
  type: ReviewEventType;
  review: Review;
  user: User;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ReviewEventHandler {
  handleReviewEvent(event: ReviewEvent): Promise<void>;
}