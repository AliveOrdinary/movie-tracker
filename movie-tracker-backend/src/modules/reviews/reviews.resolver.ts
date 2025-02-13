//src/modules/reviews/reviews.resolver.ts
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { Review } from './entities/review.entity';
import { CreateReviewInput, UpdateReviewInput } from './dto';
import { FirebaseAuthGuard } from '../../auth/guards/firebase-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Resolver(() => Review)
export class ReviewsResolver {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Query(() => [Review])
  async reviews(): Promise<Review[]> {
    return this.reviewsService.findAll();
  }

  @Query(() => Review)
  async review(@Args('id') id: string): Promise<Review> {
    return this.reviewsService.findOne(id);
  }

  @Mutation(() => Review)
  @UseGuards(FirebaseAuthGuard)
  async createReview(
    @Args('input') input: CreateReviewInput,
    @CurrentUser() user: User,
  ): Promise<Review> {
    return this.reviewsService.create(input, user);
  }

  @Query(() => [Review])
  @UseGuards(FirebaseAuthGuard)
  async myReviews(@CurrentUser() user: User): Promise<Review[]> {
    return this.reviewsService.findByUser(user.id);
  }

  @Mutation(() => Review)
  @UseGuards(FirebaseAuthGuard)
  async updateReview(
    @Args('id') id: string,
    @Args('input') input: UpdateReviewInput,
    @CurrentUser() user: User,
  ): Promise<Review> {
    return this.reviewsService.update(id, input, user);
  }

  @Mutation(() => Boolean)
  @UseGuards(FirebaseAuthGuard)
  async removeReview(
    @Args('id') id: string,
    @CurrentUser() user: User,
  ): Promise<boolean> {
    return this.reviewsService.remove(id, user);
  }
}