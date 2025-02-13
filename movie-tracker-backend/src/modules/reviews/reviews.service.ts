//src/modules/reviews/reviews.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review, ReviewStatus } from './entities/review.entity';
import { CreateReviewInput, UpdateReviewInput } from './dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private reviewsRepository: Repository<Review>,
  ) {}

  async create(input: CreateReviewInput, user: User): Promise<Review> {
    const review = this.reviewsRepository.create({
      ...input,
      user,
      status: ReviewStatus.PENDING,
    });

    return await this.reviewsRepository.save(review);
  }

  async findAll(): Promise<Review[]> {
    return this.reviewsRepository.find({
      where: { status: ReviewStatus.APPROVED },
      relations: ['user'],
    });
  }

  async findOne(id: string): Promise<Review> {
    const review = await this.reviewsRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    return review;
  }

  async findByUser(userId: string): Promise<Review[]> {
    return this.reviewsRepository.find({
      where: { user: { id: userId } },
      relations: ['user'],
    });
  }

  async update(id: string, input: UpdateReviewInput, user: User): Promise<Review> {
    const review = await this.findOne(id);

    if (review.user.id !== user.id) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    Object.assign(review, input);
    review.isEdited = true;
    review.status = ReviewStatus.PENDING; // Re-review after edit

    return this.reviewsRepository.save(review);
  }

  async remove(id: string, user: User): Promise<boolean> {
    const review = await this.findOne(id);

    if (review.user.id !== user.id) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    await this.reviewsRepository.remove(review);
    return true;
  }

  // Moderation methods
  async approveReview(id: string): Promise<Review> {
    const review = await this.findOne(id);
    review.status = ReviewStatus.APPROVED;
    review.moderatedAt = new Date();
    return this.reviewsRepository.save(review);
  }

  async rejectReview(id: string, reason: string): Promise<Review> {
    const review = await this.findOne(id);
    review.status = ReviewStatus.REJECTED;
    review.moderatedAt = new Date();
    review.moderationReason = reason;
    return this.reviewsRepository.save(review);
  }

  async flagReview(id: string, reason: string): Promise<Review> {
    const review = await this.findOne(id);
    review.status = ReviewStatus.FLAGGED;
    review.moderatedAt = new Date();
    review.moderationReason = reason;
    return this.reviewsRepository.save(review);
  }

  async updateReviewStatus(id: string, status: ReviewStatus): Promise<Review> {
    const review = await this.findOne(id);
    review.status = status;
    review.moderatedAt = new Date();
    return this.reviewsRepository.save(review);
  }
}