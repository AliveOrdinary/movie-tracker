//src/modules/admin/resolvers/content-management.resolver.ts
import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ContentManagementService } from '../services/content-management.service';
import { Review } from '../../reviews/entities/review.entity';
import { FirebaseAuthGuard } from '../../../auth/guards/firebase-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../../../common/enums/roles.enum';

@Resolver()
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MODERATOR)
export class ContentManagementResolver {
  constructor(
    private readonly contentManagementService: ContentManagementService,
  ) {}

  @Query(() => [Review])
  async flaggedContent(
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
  ): Promise<Review[]> {
    const [reviews] = await this.contentManagementService.getFlaggedContent(page, limit);
    return reviews;
  }

  @Mutation(() => Review)
  async approveContent(
    @CurrentUser() moderator: User,
    @Args('reviewId') reviewId: string,
    @Args('reason', { nullable: true }) reason?: string,
  ): Promise<Review> {
    return this.contentManagementService.approveContent(reviewId, moderator, reason);
  }

  @Mutation(() => Review)
  async flagContent(
    @CurrentUser() moderator: User,
    @Args('reviewId') reviewId: string,
    @Args('reason') reason: string,
  ): Promise<Review> {
    return this.contentManagementService.flagContent(reviewId, moderator, reason);
  }

  @Query(() => [Review])
  async searchContent(
    @Args('query') query: string,
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
  ): Promise<Review[]> {
    const [reviews] = await this.contentManagementService.searchContent(query, 'recent', page, limit);
    return reviews;
  }
}