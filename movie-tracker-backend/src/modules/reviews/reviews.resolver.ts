// src/modules/reviews/reviews.resolver.ts
import { Resolver, Query, Mutation, Args, ResolveField, Parent, Int, ObjectType, Field } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { Review } from './entities/review.entity';
import { ReviewReaction, ReactionType } from './entities/review-reaction.entity';
import { CreateReviewInput } from './dto/create-review.input';
import { UpdateReviewInput } from './dto/update-review.input';
import { AddReactionInput } from './dto/add-reaction.input';
import { RemoveReactionInput } from './dto/remove-reaction.input';
import { FirebaseAuthGuard } from '../../auth/guards/firebase-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../../common/enums/roles.enum';

@ObjectType()
class ReactionStats {
  @Field(() => ReactionType)
  type: ReactionType;

  @Field(() => Int)
  count: number;
}

@Resolver(() => Review)
export class ReviewsResolver {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Mutation(() => Review)
  @UseGuards(FirebaseAuthGuard)
  async createReview(
    @Args('input') input: CreateReviewInput,
    @CurrentUser() user: User,
  ): Promise<Review> {
    return this.reviewsService.create(input, user);
  }

  @Query(() => [Review])
  async reviews(): Promise<Review[]> {
    return this.reviewsService.findAll();
  }

  @Query(() => Review)
  async review(@Args('id') id: string): Promise<Review> {
    return this.reviewsService.findOne(id);
  }

  @Query(() => [Review])
  @UseGuards(FirebaseAuthGuard)
  async myReviews(@CurrentUser() user: User): Promise<Review[]> {
    return this.reviewsService.findByUser(user.id);
  }

  @Query(() => [Review])
  async movieReviews(@Args('movieId') movieId: string): Promise<Review[]> {
    return this.reviewsService.findByMovie(movieId);
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
  async deleteReview(
    @Args('id') id: string,
    @CurrentUser() user: User,
  ): Promise<boolean> {
    return this.reviewsService.remove(id, user);
  }

  @Mutation(() => Review)
  @UseGuards(FirebaseAuthGuard)
  async addReaction(
    @Args('input') input: AddReactionInput,
    @CurrentUser() user: User,
  ): Promise<Review> {
    return this.reviewsService.addReaction(input, user);
  }

  @Mutation(() => Review)
  @UseGuards(FirebaseAuthGuard)
  async removeReaction(
    @Args('input') input: RemoveReactionInput,
    @CurrentUser() user: User,
  ): Promise<Review> {
    return this.reviewsService.removeReaction(input.reviewId, input.type, user);
  }

  @ResolveField(() => [ReactionStats])
  async reactionStats(@Parent() review: Review): Promise<ReactionStats[]> {
    const stats = await this.reviewsService.getReactionStats(review.id);
    return Array.from(stats.entries()).map(([type, count]) => ({
      type,
      count,
    }));
  }

  @ResolveField(() => ReactionType, { nullable: true })
  async userReaction(
    @Parent() review: Review,
    @CurrentUser() user: User,
  ): Promise<ReactionType | null> {
    if (!user) return null;
    return this.reviewsService.getUserReaction(review.id, user.id);
  }

  // Moderation endpoints
  @Mutation(() => Review)
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  async approveReview(@Args('id') id: string): Promise<Review> {
    return this.reviewsService.approveReview(id);
  }

  @Mutation(() => Review)
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  async rejectReview(
    @Args('id') id: string,
    @Args('reason') reason: string,
  ): Promise<Review> {
    return this.reviewsService.rejectReview(id, reason);
  }

  @Mutation(() => Review)
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  async flagReview(
    @Args('id') id: string,
    @Args('reason') reason: string,
  ): Promise<Review> {
    return this.reviewsService.flagReview(id, reason);
  }
}