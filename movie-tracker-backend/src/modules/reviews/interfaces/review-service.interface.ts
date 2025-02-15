// src/modules/reviews/interfaces/review-service.interface.ts
import { Review } from '../entities/review.entity';
import { ReviewFilters } from '../types/review-filters.type';
import { CreateReviewInput } from '../dto/create-review.input';
import { UpdateReviewInput } from '../dto/update-review.input';
import { ReactionType } from '../entities/review-reaction.entity';
import { ReviewStats } from '../types/review-stats.type';
import { ModerationResult, ModerationAction } from '../types/review-moderation.type';
import { User } from '../../users/entities/user.entity';

export interface IReviewService {
  create(input: CreateReviewInput, user: User): Promise<Review>;
  update(id: string, input: UpdateReviewInput, user: User): Promise<Review>;
  delete(id: string, user: User): Promise<boolean>;
  findOne(id: string): Promise<Review>;
  findByMovie(movieId: string, filters: ReviewFilters): Promise<[Review[], number]>;
  findByUser(userId: string, filters: ReviewFilters): Promise<[Review[], number]>;
  addReaction(reviewId: string, type: ReactionType, user: User): Promise<Review>;
  removeReaction(reviewId: string, type: ReactionType, user: User): Promise<Review>;
  getStats(movieId: string): Promise<ReviewStats>;
  moderateReview(reviewId: string, action: ModerationAction, reason?: string): Promise<ModerationResult>;
  reportReview(reviewId: string, reason: string, user: User): Promise<boolean>;
}