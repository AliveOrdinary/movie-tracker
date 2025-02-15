// src/modules/reviews/interfaces/review-notification.interface.ts
import { ReviewEventType } from '../events/review.events';
export interface ReviewNotification {
    type: ReviewEventType;
    reviewId: string;
    userId: string;
    movieId: string;
    timestamp: Date;
    data?: any;
  }