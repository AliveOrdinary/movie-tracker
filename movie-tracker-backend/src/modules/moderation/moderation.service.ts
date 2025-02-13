import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './entities/report.entity';
import { Review, ReviewStatus } from '../reviews/entities/review.entity';

@Injectable()
export class ModerationService {
  constructor(
    @InjectRepository(Report)
    private reportsRepository: Repository<Report>,
    @InjectRepository(Review)
    private reviewsRepository: Repository<Review>,
  ) {}

  async flagReview(reviewId: string, reason: string): Promise<Review> {
    const review = await this.reviewsRepository.findOne({ where: { id: reviewId } });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Update review status to flagged
    review.status = ReviewStatus.FLAGGED;
    review.moderationReason = reason;
    review.moderatedAt = new Date();
    review.isFlagged = true;

    return this.reviewsRepository.save(review);
  }

  async getReportedContent(): Promise<Report[]> {
    return this.reportsRepository.find({
      relations: ['review', 'review.user'],
      where: { status: 'PENDING' }
    });
  }

  async resolveReport(reportId: string, action: string): Promise<Report> {
    const report = await this.reportsRepository.findOne({
      where: { id: reportId },
      relations: ['review']
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    report.status = 'RESOLVED';
    report.resolution = action;

    // If action is delete, remove the review
    if (action === 'DELETE' && report.review) {
      await this.reviewsRepository.remove(report.review);
    }

    return this.reportsRepository.save(report);
  }

  async getReportsByStatus(status: string): Promise<Report[]> {
    return this.reportsRepository.find({
      where: { status },
      relations: ['review', 'review.user']
    });
  }

  async getFlaggedReviews(): Promise<Review[]> {
    return this.reviewsRepository.find({
      where: { status: ReviewStatus.FLAGGED },
      relations: ['user']
    });
  }

  async approveReview(reviewId: string): Promise<Review> {
    const review = await this.reviewsRepository.findOne({ where: { id: reviewId } });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    review.status = ReviewStatus.APPROVED;
    review.isFlagged = false;
    review.moderatedAt = new Date();

    return this.reviewsRepository.save(review);
  }

  async rejectReview(reviewId: string, reason: string): Promise<Review> {
    const review = await this.reviewsRepository.findOne({ where: { id: reviewId } });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    review.status = ReviewStatus.REJECTED;
    review.moderationReason = reason;
    review.moderatedAt = new Date();

    return this.reviewsRepository.save(review);
  }
}