// src/modules/reviews/interfaces/review-service.interface.ts
import { Review } from '../entities/review.entity';
import { User } from '../../users/entities/user.entity';
import { CreateReviewInput } from '../dto/create-review.input';
import { UpdateReviewInput } from '../dto/update-review.input';
import { MovieReviewFilters, UserReviewFilters } from '../types/review-filters.type';
import { ReviewStats } from '../types/review-stats.type';
import { ReactionType } from '../../../common/enums';

export interface IReviewService {
  create(input: CreateReviewInput, user: User, options?: any): Promise<Review>;
  
  update(id: string, input: UpdateReviewInput, user: User, options?: any): Promise<Review>;
  
  remove(id: string, user: User, options?: any): Promise<boolean>;
  
  findOne(id: string): Promise<Review>;
  
  findAll(): Promise<Review[]>;
  
  findByMovie(movieId: string, filters?: MovieReviewFilters): Promise<[Review[], number]>;
  
  findByUser(userId: string, filters?: UserReviewFilters): Promise<[Review[], number]>;
  
  addReaction(input: { reviewId: string; type: ReactionType }, user: User): Promise<Review>;
  
  removeReaction(reviewId: string, type: ReactionType, user: User): Promise<Review>;
  
  getReactionStats(reviewId: string): Promise<Map<ReactionType, number>>;
  
  getUserReaction(reviewId: string, userId: string): Promise<ReactionType | null>;
  
  getMovieReviewStats(movieId: string): Promise<ReviewStats>;
  
  getUserReviewStats(userId: string): Promise<ReviewStats>;
}