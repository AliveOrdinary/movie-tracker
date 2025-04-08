// src/modules/admin/resolvers/content-management.resolver.ts
import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards, Logger } from '@nestjs/common';
import { AuthGuard } from '../../../auth/guards/auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { UserRole } from '../../../common/enums';
import { ContentManagementService } from '../services/content-management.service';
import { AuditService } from '../services/audit.service';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { BulkContentOperationInput } from '../dto/bulk-content-operations.dto';
import { Review } from '../../reviews/entities/review.entity';
import { List } from '../../lists/entities/list.entity';
import { Movie } from '../../movies/entities/movie.entity';
import { AdminActionType } from '../entities/admin-audit-log.entity';

@Resolver()
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MODERATOR)
export class ContentManagementResolver {
  private readonly logger = new Logger(ContentManagementResolver.name);

  constructor(
    private readonly contentManagementService: ContentManagementService,
    private readonly auditService: AuditService,
  ) {}

  @Query(() => [Review])
  async flaggedReviews(
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
  ): Promise<Review[]> {
    this.logger.log(`Fetching flagged reviews, page ${page}, limit ${limit}`);
    return this.contentManagementService.getFlaggedReviews(page, limit);
  }

  @Query(() => [Review])
  async pendingReviews(
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
  ): Promise<Review[]> {
    this.logger.log(`Fetching pending reviews, page ${page}, limit ${limit}`);
    return this.contentManagementService.getPendingReviews(page, limit);
  }

  @Mutation(() => Boolean)
  async bulkApproveReviews(
    @CurrentUser() admin: User,
    @Args('input') input: BulkContentOperationInput,
  ): Promise<boolean> {
    this.logger.log(`Bulk approving ${input.ids.length} reviews`);
    const result = await this.contentManagementService.bulkApproveReviews(input.ids);
    
    // Log the action
    await this.auditService.logAdminAction(
    admin.id,
    `Approved ${result.successCount} reviews (Failed: ${result.failureCount})`
    );
    
    return result.successCount > 0;
  }

  @Mutation(() => Boolean)
  async bulkRejectReviews(
    @CurrentUser() admin: User,
    @Args('input') input: BulkContentOperationInput,
    @Args('reason', { nullable: true }) reason: string,
  ): Promise<boolean> {
    this.logger.log(`Bulk rejecting ${input.ids.length} reviews`);
    const result = await this.contentManagementService.bulkRejectReviews(input.ids, reason);
    
    // Log the action
    await this.auditService.logAdminAction(
    admin.id,
    `Rejected ${result.successCount} reviews with reason: ${reason || 'None provided'} (Failed: ${result.failureCount})`
    );
    
    return result.successCount > 0;
  }

  @Mutation(() => Boolean)
  async bulkDeleteReviews(
    @CurrentUser() admin: User,
    @Args('input') input: BulkContentOperationInput,
  ): Promise<boolean> {
    this.logger.log(`Bulk deleting ${input.ids.length} reviews`);
    const result = await this.contentManagementService.bulkDeleteReviews(input.ids);
    
    // Log the action
    await this.auditService.logAdminAction(
    admin.id,
    `Deleted ${result.successCount} reviews (Failed: ${result.failureCount})`
    );
    
    return result.successCount > 0;
  }

  @Mutation(() => Boolean)
  async bulkDeleteLists(
    @CurrentUser() admin: User,
    @Args('input') input: BulkContentOperationInput,
  ): Promise<boolean> {
    this.logger.log(`Bulk deleting ${input.ids.length} lists`);
    const result = await this.contentManagementService.bulkDeleteLists(input.ids);
    
    // Log the action
    await this.auditService.logAdminAction(
    admin.id,
    `Deleted ${result.successCount} lists (Failed: ${result.failureCount})`
    );
    
    return result.successCount > 0;
  }

  @Mutation(() => Boolean)
  async featureList(
    @Args('listId') listId: string,
    @Args('featured') featured: boolean,
    @CurrentUser() admin: User,
  ): Promise<boolean> {
    this.logger.log(`${featured ? 'Featuring' : 'Unfeaturing'} list ${listId}`);
    const result = await this.contentManagementService.setListFeatured(listId, featured);
    
    // Log the action
    await this.auditService.logAdminAction(
    admin.id,
    `${featured ? 'Featured' : 'Unfeatured'} list ${listId}`,
    '',
    listId,
    'List'
    );
    
    return result;
  }

  @Mutation(() => Boolean)
  async bulkFeatureLists(
    @CurrentUser() admin: User,
    @Args('input') input: BulkContentOperationInput,
    @Args('featured') featured: boolean,
  ): Promise<boolean> {
    this.logger.log(`Bulk ${featured ? 'featuring' : 'unfeaturing'} ${input.ids.length} lists`);
    const result = await this.contentManagementService.bulkSetListFeatured(input.ids, featured);
    
    // Log the action
    await this.auditService.logAdminAction(
    admin.id,
    `${featured ? 'Featured' : 'Unfeatured'} ${result.successCount} lists (Failed: ${result.failureCount})`
    );
    
    return result.successCount > 0;
  }

  @Query(() => [Movie])
  async popularMovies(
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
  ): Promise<Movie[]> {
    this.logger.log(`Fetching popular movies, page ${page}, limit ${limit}`);
    return this.contentManagementService.getPopularMovies(page, limit);
  }

  @Mutation(() => Boolean)
  async setMoviePopular(
    @CurrentUser() admin: User,
    @Args('movieId') movieId: string,
    @Args('isPopular') isPopular: boolean,
  ): Promise<boolean> {
    this.logger.log(`Setting movie ${movieId} popular status to ${isPopular}`);
    const result = await this.contentManagementService.setMoviePopular(movieId, isPopular);
    
    // Log the action
    await this.auditService.logAdminAction(
    admin.id,
    `Set movie ${movieId} popular status to ${isPopular}`,
    '',
    movieId,
    'Movie'
    );
    
    return result;
  }

  @Mutation(() => Boolean)
  async bulkSetMoviesPopular(
    @CurrentUser() admin: User,
    @Args('input') input: BulkContentOperationInput,
    @Args('isPopular') isPopular: boolean,
  ): Promise<boolean> {
    this.logger.log(`Bulk setting popular status to ${isPopular} for ${input.ids.length} movies`);
    const result = await this.contentManagementService.bulkSetMoviesPopular(input.ids, isPopular);
    
    // Log the action
    await this.auditService.logAdminAction(
    admin.id,
    `Set popular status to ${isPopular} for ${result.successCount} movies (Failed: ${result.failureCount})`
    );
    
    return result.successCount > 0;
  }

  @Mutation(() => Boolean)
  async refreshMovieMetadata(
    @Args('movieId') movieId: string,
    @CurrentUser() admin: User,
  ): Promise<boolean> {
    this.logger.log(`Refreshing metadata for movie ${movieId}`);
    const result = await this.contentManagementService.refreshMovieMetadata(movieId);
    
    // Log the action
    await this.auditService.logAdminAction(
    admin.id,
    `Refreshed metadata for movie ${movieId}`,
    '',
    movieId,
    'Movie'
    );
    
    return result;
  }

  @Mutation(() => Boolean)
  async bulkRefreshMoviesMetadata(
    @CurrentUser() admin: User,
    @Args('input') input: BulkContentOperationInput,
  ): Promise<boolean> {
    this.logger.log(`Bulk refreshing metadata for ${input.ids.length} movies`);
    const result = await this.contentManagementService.bulkRefreshMoviesMetadata(input.ids);
    
    // Log the action
    await this.auditService.logAdminAction(
    admin.id,
    `Refreshed metadata for ${result.successCount} movies (Failed: ${result.failureCount})`
    );
    
    return result.successCount > 0;
  }
}