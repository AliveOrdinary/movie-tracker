// src/modules/reviews/reviews.resolver.ts
import { Resolver, Query, Mutation, Args, ResolveField, Parent, Int, ObjectType, Field } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsTmdbService } from './reviews-tmdb.service';
import { Review } from './entities/review.entity';
import { CreateReviewInput } from './dto/create-review.input';
import { UpdateReviewInput } from './dto/update-review.input';
import { AddReactionInput } from './dto/add-reaction.input';
import { RemoveReactionInput } from './dto/remove-reaction.input';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { User } from '../users/entities/user.entity';
import { ReactionType, UserRole, ReviewStatus } from 'src/common/enums';
import { ModerationService } from '../moderation/moderation.service';
import { MovieReviewFilters, UserReviewFilters } from './types/review-filters.type';

@ObjectType()
class ReactionStats {
  @Field(() => ReactionType)
  type: ReactionType;

  @Field(() => Int)
  count: number;
}

@Resolver(() => Review)
export class ReviewsResolver {
  constructor(
    private readonly reviewsService: ReviewsService,
    private readonly reviewsTmdbService: ReviewsTmdbService,
    private readonly moderationService: ModerationService
  ) {}

  @Mutation(() => Review)
  @UseGuards(AuthGuard)
  async createReview(
    @CurrentUser() user: User,
    @Args('input') input: CreateReviewInput,
  ): Promise<Review> {
    // Now use the new ReviewsTmdbService that handles TMDB ID conversion
    return this.reviewsTmdbService.createReview(input, user);
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
  @UseGuards(AuthGuard)
  async myReviews(
    @CurrentUser() user: User,
    @Args('filters', { nullable: true }) filters?: UserReviewFilters
  ): Promise<Review[]> {
    const [reviews] = await this.reviewsService.findByUser(user.id, filters);
    return reviews;
  }

  @Query(() => [Review])
  async movieReviews(
    @Args('movieId') movieId: string,
    @Args('filters', { nullable: true }) filters?: MovieReviewFilters
  ): Promise<Review[]> {
    const [reviews] = await this.reviewsService.findByMovie(movieId, filters);
    return reviews;
  }

  @Mutation(() => Review)
  @UseGuards(AuthGuard)
  async updateReview(
    @CurrentUser() user: User,
    @Args('id') id: string,
    @Args('input') input: UpdateReviewInput,
  ): Promise<Review> {
    return this.reviewsService.update(id, {
      ...input,
      user,
      isEdited: true
    });
  }

  @Mutation(() => Boolean)
  @UseGuards(AuthGuard)
  async deleteReview(
    @CurrentUser() user: User,
    @Args('id') id: string,
  ): Promise<boolean> {
    return this.reviewsService.remove(id, user);
  }

  @Mutation(() => Review)
  @UseGuards(AuthGuard)
  async addReaction(
    @CurrentUser() user: User,
    @Args('input') input: AddReactionInput,
  ): Promise<Review> {
    return this.reviewsService.addReaction(input, user);
  }

  @Mutation(() => Review)
  @UseGuards(AuthGuard)
  async removeReaction(
    @CurrentUser() user: User,
    @Args('input') input: RemoveReactionInput,
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
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  async approveReview(@Args('id') id: string, @CurrentUser() moderator: User): Promise<Review> {
    return this.moderationService.approveReview(id, moderator);
  }

  @Mutation(() => Review)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  async rejectReview(
    @CurrentUser() moderator: User,
    @Args('id') id: string,
    @Args('reason') reason: string, 
  ): Promise<Review> {
    return this.moderationService.rejectReview(id, reason, moderator);
  }

  @Mutation(() => Review)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  async flagReview(
    @CurrentUser() moderator: User,
    @Args('id') id: string,
    @Args('reason') reason: string,
  ): Promise<Review> {
    return this.moderationService.flagReview(id, reason, moderator);
  }

  // Additional fields to expose moderation status
  @ResolveField('isFlagged', () => Boolean, { nullable: true })
  getIsFlagged(@Parent() review: Review): boolean {
    return review.isFlagged || false;
  }

  @ResolveField('isAutoModerated', () => Boolean, { nullable: true })
  getIsAutoModerated(@Parent() review: Review): boolean {
    return review.isAutoModerated || false;
  }

  @ResolveField('moderationReason', () => String, { nullable: true })
  getModerationReason(@Parent() review: Review): string | null {
    return review.moderationReason || null;
  }

  @ResolveField('moderatedAt', () => Date, { nullable: true })
  getModeratedAt(@Parent() review: Review): Date | null {
    return review.moderatedAt || null;
  }
}