// src/modules/reviews/reviews.service.ts
import { 
  Injectable, 
  NotFoundException, 
  ForbiddenException, 
  ConflictException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, FindOptionsWhere } from 'typeorm';
import { Cache } from 'cache-manager';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Review, ReviewStatus } from './entities/review.entity';
import { ReviewReaction, ReactionType } from './entities/review-reaction.entity';
import { CreateReviewInput } from './dto/create-review.input';
import { UpdateReviewInput } from './dto/update-review.input';
import { ReviewFilters, ReviewSortType } from './types/review-filters.type';
import { ReviewStats } from './types/review-stats.type';
import { ModerationAction, ModerationResult } from './types/review-moderation.type';
import { ReactionSummary } from './types/reaction-summary.type';
import { User } from '../users/entities/user.entity';
import { WatchHistoryService } from '../watch-history/watch-history.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CACHE_KEYS } from './constants/cache-keys.constant';
import { ReviewEventType } from './events/review.events';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { WatchType } from '../watch-history/entities/watch-history.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(ReviewReaction)
    private reactionRepository: Repository<ReviewReaction>,
    private watchHistoryService: WatchHistoryService,
    private notificationsService: NotificationsService,
    private eventEmitter: EventEmitter2,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(input: CreateReviewInput, user: User): Promise<Review> {
    // Find or create watch history entry
    let watchHistory = input.watchHistoryId ? 
      await this.watchHistoryService.findOne(input.watchHistoryId, user) :
      await this.watchHistoryService.findByMovieAndUser(input.movieId, user.id);

    if (!watchHistory) {
      watchHistory = await this.watchHistoryService.create({
        movieId: input.movieId,
        watchedAt: new Date(),
        rating: input.rating,
        watchType: WatchType.FIRST_TIME,  // Using the enum
        userId: user.id,
        isPrivate: false
      });
    }

    // Check for existing review
    const existingReview = await this.reviewRepository.findOne({
      where: {
        user: { id: user.id },
        movie: { id: input.movieId }
      }
    });

    if (existingReview) {
      throw new ConflictException('You have already reviewed this movie');
    }

    const review = this.reviewRepository.create({
      ...input,
      user,
      watchHistory,
      status: ReviewStatus.PENDING
    });

    const savedReview = await this.reviewRepository.save(review);

    this.eventEmitter.emit(ReviewEventType.REVIEW_CREATED, {
      review: savedReview,
      user,
      timestamp: new Date()
    });

    await this.invalidateRelatedCaches(input.movieId, user.id);

    return savedReview;
  }

  async update(id: string, input: UpdateReviewInput, user: User): Promise<Review> {
    const review = await this.findOne(id);

    if (review.user.id !== user.id) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    Object.assign(review, {
      ...input,
      isEdited: true,
      status: ReviewStatus.PENDING // Reset status for re-moderation
    });

    const updatedReview = await this.reviewRepository.save(review);

    this.eventEmitter.emit(ReviewEventType.REVIEW_UPDATED, {
      review: updatedReview,
      user,
      timestamp: new Date()
    });

    await this.invalidateRelatedCaches(review.movie.id, user.id);

    return updatedReview;
  }

  async findAll(): Promise<Review[]> {
    return this.reviewRepository.find({
      where: { status: ReviewStatus.APPROVED },
      relations: ['user', 'movie', 'reactions'],
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: string): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['user', 'movie', 'reactions', 'watchHistory']
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    return review;
  }

  async findByMovie(movieId: string): Promise<Review[]> {
    return this.reviewRepository.find({
      where: { 
        movie: { id: movieId },
        status: ReviewStatus.APPROVED
      },
      relations: ['user', 'reactions'],
      order: { createdAt: 'DESC' }
    });
  }

  async findByUser(userId: string): Promise<Review[]> {
    return this.reviewRepository.find({
      where: { user: { id: userId } },
      relations: ['movie', 'reactions'],
      order: { createdAt: 'DESC' }
    });
  }

  async remove(id: string, user: User): Promise<boolean> {
    const review = await this.findOne(id);

    if (review.user.id !== user.id) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    await this.reviewRepository.remove(review);

    this.eventEmitter.emit(ReviewEventType.REVIEW_DELETED, {
      review,
      user,
      timestamp: new Date()
    });

    await this.invalidateRelatedCaches(review.movie.id, user.id);

    return true;
  }

  async getReactionStats(reviewId: string): Promise<Map<ReactionType, number>> {
    const reactions = await this.reactionRepository.find({
      where: { review: { id: reviewId } }
    });

    const stats = new Map<ReactionType, number>();
    Object.values(ReactionType).forEach(type => stats.set(type, 0));

    reactions.forEach(reaction => {
      stats.set(reaction.type, (stats.get(reaction.type) || 0) + 1);
    });

    return stats;
  }

  async getUserReaction(reviewId: string, userId: string): Promise<ReactionType | null> {
    const reaction = await this.reactionRepository.findOne({
      where: {
        review: { id: reviewId },
        user: { id: userId }
      }
    });

    return reaction?.type || null;
  }

  async addReaction(input: { reviewId: string; type: ReactionType }, user: User): Promise<Review> {
    const review = await this.findOne(input.reviewId);

    const existingReaction = await this.reactionRepository.findOne({
      where: {
        user: { id: user.id },
        review: { id: input.reviewId },
        type: input.type
      }
    });

    if (existingReaction) {
      throw new ConflictException('You have already added this reaction');
    }

    const reaction = this.reactionRepository.create({
      type: input.type,
      user,
      review
    });

    await this.reactionRepository.save(reaction);

    review.reactionCount = await this.reactionRepository.count({
      where: { review: { id: review.id } }
    });

    const updatedReview = await this.reviewRepository.save(review);

    this.eventEmitter.emit(ReviewEventType.REACTION_ADDED, {
      review: updatedReview,
      user,
      reactionType: input.type,
      timestamp: new Date()
    });

    return updatedReview;
  }

  async removeReaction(reviewId: string, type: ReactionType, user: User): Promise<Review> {
    const review = await this.findOne(reviewId);

    const reaction = await this.reactionRepository.findOne({
      where: {
        user: { id: user.id },
        review: { id: reviewId },
        type
      }
    });

    if (!reaction) {
      throw new NotFoundException('Reaction not found');
    }

    await this.reactionRepository.remove(reaction);

    review.reactionCount = await this.reactionRepository.count({
      where: { review: { id: review.id } }
    });

    const updatedReview = await this.reviewRepository.save(review);

    this.eventEmitter.emit(ReviewEventType.REACTION_REMOVED, {
      review: updatedReview,
      user,
      reactionType: type,
      timestamp: new Date()
    });

    return updatedReview;
  }

  private async invalidateRelatedCaches(movieId: string, userId: string): Promise<void> {
    await Promise.all([
      this.cacheManager.del(CACHE_KEYS.MOVIE_REVIEWS(movieId)),
      this.cacheManager.del(CACHE_KEYS.USER_REVIEWS(userId)),
      this.cacheManager.del(CACHE_KEYS.REVIEW_STATS(movieId)),
      this.cacheManager.del(CACHE_KEYS.USER_STATS(userId))
    ]);
  }

  async reportReview(reviewId: string, reason: string, user: User): Promise<boolean> {
    const review = await this.findOne(reviewId);

    if (review.user.id === user.id) {
      throw new BadRequestException('You cannot report your own review');
    }

    review.status = ReviewStatus.FLAGGED;
    review.moderationReason = reason;
    review.moderatedAt = new Date();

    await this.reviewRepository.save(review);

    this.eventEmitter.emit(ReviewEventType.REVIEW_REPORTED, {
      review,
      user,
      reason,
      timestamp: new Date()
    });

    return true;
  }

  async approveReview(reviewId: string): Promise<Review> {
    const review = await this.findOne(reviewId);
    review.status = ReviewStatus.APPROVED;
    review.moderatedAt = new Date();

    const savedReview = await this.reviewRepository.save(review);

    this.eventEmitter.emit(ReviewEventType.REVIEW_MODERATED, {
      review: savedReview,
      action: 'APPROVE',
      timestamp: new Date()
    });

    return savedReview;
  }

  async rejectReview(reviewId: string, reason: string): Promise<Review> {
    const review = await this.findOne(reviewId);
    review.status = ReviewStatus.REJECTED;
    review.moderationReason = reason;
    review.moderatedAt = new Date();

    const savedReview = await this.reviewRepository.save(review);

    this.eventEmitter.emit(ReviewEventType.REVIEW_MODERATED, {
      review: savedReview,
      action: 'REJECT',
      reason,
      timestamp: new Date()
    });

    return savedReview;
  }

  async flagReview(reviewId: string, reason: string): Promise<Review> {
    const review = await this.findOne(reviewId);
    review.status = ReviewStatus.FLAGGED;
    review.moderationReason = reason;
    review.moderatedAt = new Date();
    review.isFlagged = true;

    const savedReview = await this.reviewRepository.save(review);

    this.eventEmitter.emit(ReviewEventType.REVIEW_MODERATED, {
      review: savedReview,
      action: 'FLAG',
      reason,
      timestamp: new Date()
    });

    return savedReview;
  }

  async getMovieReviewStats(movieId: string): Promise<ReviewStats> {
    const cachedStats = await this.cacheManager.get<ReviewStats>(
      CACHE_KEYS.REVIEW_STATS(movieId)
    );
    if (cachedStats) return cachedStats;

    const reviews = await this.reviewRepository.find({
      where: { 
        movie: { id: movieId },
        status: ReviewStatus.APPROVED
      }
    });

    const stats = {
      totalReviews: reviews.length,
      averageRating: reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length || 0,
      totalReactions: reviews.reduce((acc, r) => acc + r.reactionCount, 0),
      recentReviews: reviews.filter(r => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return r.createdAt >= thirtyDaysAgo;
      }).length,
      positivePercentage: (reviews.filter(r => r.rating >= 7).length / reviews.length) * 100 || 0
    };

    await this.cacheManager.set(
      CACHE_KEYS.REVIEW_STATS(movieId),
      stats,
      60 * 30 // 30 minutes
    );

    return stats;
  }

  async getUserReviewStats(userId: string): Promise<ReviewStats> {
    const cachedStats = await this.cacheManager.get<ReviewStats>(
      CACHE_KEYS.USER_STATS(userId)
    );
    if (cachedStats) return cachedStats;

    const reviews = await this.reviewRepository.find({
      where: { user: { id: userId } }
    });

    const stats = {
      totalReviews: reviews.length,
      averageRating: reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length || 0,
      totalReactions: reviews.reduce((acc, r) => acc + r.reactionCount, 0),
      recentReviews: reviews.filter(r => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return r.createdAt >= thirtyDaysAgo;
      }).length,
      positivePercentage: (reviews.filter(r => r.rating >= 7).length / reviews.length) * 100 || 0
    };

    await this.cacheManager.set(
      CACHE_KEYS.USER_STATS(userId),
      stats,
      60 * 30 // 30 minutes
    );

    return stats;
  }
}