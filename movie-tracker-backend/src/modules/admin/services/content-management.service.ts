// src/modules/admin/services/content-management.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Review, ReviewStatus } from '../../reviews/entities/review.entity';
import { ModerationLog, ModerationAction } from '../entities/moderation-log.entity';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class ContentManagementService {
  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(ModerationLog)
    private moderationLogRepository: Repository<ModerationLog>,
  ) {}

  async getFlaggedContent(page = 1, limit = 10): Promise<[Review[], number]> {
    return this.reviewRepository.findAndCount({
      where: { status: ReviewStatus.FLAGGED },
      relations: ['user'],
      skip: (page - 1) * limit,
      take: limit,
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async getReportedContent(page = 1, limit = 10): Promise<[Review[], number]> {
    return this.reviewRepository.findAndCount({
      where: { status: ReviewStatus.FLAGGED },
      relations: ['user'],
      skip: (page - 1) * limit,
      take: limit,
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async searchContent(
    query: string,
    sortBy: 'recent' | 'reports' = 'recent',
    page = 1,
    limit = 10,
  ): Promise<[Review[], number]> {
    const order: { [key: string]: 'ASC' | 'DESC' } = {};

    if (sortBy === 'recent') {
      order.createdAt = 'DESC';
    } else {
      order.updatedAt = 'DESC';
    }

    return this.reviewRepository.findAndCount({
      where: [
        { content: ILike(`%${query}%`) },
        { user: { username: ILike(`%${query}%`) } }
      ],
      relations: ['user'],
      skip: (page - 1) * limit,
      take: limit,
      order,
    });
  }

  async approveContent(
    reviewId: string,
    moderator: User,
    reason?: string,
  ): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
      relations: ['user'],
    });

    if (!review) {
      throw new Error('Review not found');
    }

    review.status = ReviewStatus.APPROVED;
    review.moderatedAt = new Date();
    review.moderationReason = reason || 'Approved by moderator';

    const savedReview = await this.reviewRepository.save(review);

    await this.createModerationLog({
      moderator,
      review: savedReview,
      action: ModerationAction.REVIEW_APPROVED,
      reason: reason || 'Content approved',
    });

    return savedReview;
  }

  async flagContent(
    reviewId: string,
    moderator: User,
    reason: string,
  ): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
      relations: ['user'],
    });

    if (!review) {
      throw new Error('Review not found');
    }

    review.status = ReviewStatus.FLAGGED;
    review.moderatedAt = new Date();
    review.moderationReason = reason || 'Flagged by moderator';

    const savedReview = await this.reviewRepository.save(review);

    await this.createModerationLog({
      moderator,
      review: savedReview,
      action: ModerationAction.REVIEW_FLAGGED,
      reason,
    });

    return savedReview;
  }

  async getModerationLogs(
    page = 1,
    limit = 10,
    userId?: string,
  ): Promise<[ModerationLog[], number]> {
    const query = this.moderationLogRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.moderator', 'moderator')
      .leftJoinAndSelect('log.targetReview', 'review')
      .leftJoinAndSelect('review.user', 'user');

    if (userId) {
      query.where('user.id = :userId', { userId });
    }

    query
      .orderBy('log.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    return query.getManyAndCount();
  }

  private async createModerationLog(data: {
    moderator: User;
    action: ModerationAction;
    reason: string;
    review?: Review;
  }): Promise<ModerationLog> {
    const log = this.moderationLogRepository.create({
      moderator: data.moderator,
      action: data.action,
      reason: data.reason,
      targetReview: data.review,
      createdAt: new Date(),
    });

    return this.moderationLogRepository.save(log);
  }
}