// src/modules/moderation/resolvers/moderation-queue.resolver.ts
import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ModerationQueueService } from '../services/moderation-queue.service';
import { ModerationQueue, ModerationStatus, ModerationPriority, ContentType } from '../entities/moderation-queue.entity';
import { ModerationQueueResponse, ModerationStatistics } from '../dto/moderation-response.dto';
import { CreateModerationQueueItemInput, UpdateModerationQueueItemInput } from '../dto/moderation-queue.dto';
import { AuthGuard } from '../../../auth/guards/auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../../../common/enums';

@Resolver(() => ModerationQueue)
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MODERATOR)
export class ModerationQueueResolver {
  constructor(private readonly moderationQueueService: ModerationQueueService) {}

  @Query(() => ModerationQueueResponse)
  async moderationQueue(
    @Args('filters', { nullable: true, type: () => String }) filtersJson?: string,
  ): Promise<ModerationQueueResponse> {
    // Parse filters if provided, or use an empty object
    const filters = filtersJson ? JSON.parse(filtersJson) : {};
    const [items, total] = await this.moderationQueueService.findAll(filters);
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    
    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  @Query(() => ModerationQueue, { nullable: true })
  async moderationQueueItem(
    @Args('id') id: string,
  ): Promise<ModerationQueue> {
    return this.moderationQueueService.findOne(id);
  }

  @Query(() => ModerationQueue, { nullable: true })
  async getNextModerationItem(
    @CurrentUser() user: User,
  ): Promise<ModerationQueue | null> {
    return this.moderationQueueService.getNextItemForModeration(user);
  }

  @Query(() => ModerationStatistics)
  async moderationStatistics(): Promise<ModerationStatistics> {
    return this.moderationQueueService.getStatistics();
  }

  @Mutation(() => ModerationQueue)
  async createModerationQueueItem(
    @Args('input') input: CreateModerationQueueItemInput,
  ): Promise<ModerationQueue> {
    return this.moderationQueueService.create(input);
  }

  @Mutation(() => ModerationQueue)
  async updateModerationQueueItem(
    @CurrentUser() user: User,
    @Args('input') input: UpdateModerationQueueItemInput,
  ): Promise<ModerationQueue> {
    return this.moderationQueueService.update(input.id, input, user);
  }

  @Mutation(() => ModerationQueue)
  async assignModerationItem(
    @Args('id') id: string,
    @Args('moderatorId') moderatorId: string,
  ): Promise<ModerationQueue> {
    return this.moderationQueueService.assignToModerator(id, moderatorId);
  }

  @Mutation(() => ModerationQueue)
  async assignModerationItemToSelf(
    @CurrentUser() user: User,
    @Args('id') id: string,
  ): Promise<ModerationQueue> {
    return this.moderationQueueService.assignToModerator(id, user.id);
  }

  @Mutation(() => ModerationQueue)
  async unassignModerationItem(
    @Args('id') id: string,
  ): Promise<ModerationQueue> {
    return this.moderationQueueService.unassign(id);
  }

  @Mutation(() => ModerationQueue)
  async approveModerationItem(
    @CurrentUser() user: User,
    @Args('id') id: string,
    @Args('notes', { nullable: true }) notes: string,
  ): Promise<ModerationQueue> {
    return this.moderationQueueService.approve(id, user, notes);
  }

  @Mutation(() => ModerationQueue)
  async rejectModerationItem(
    @CurrentUser() user: User,
    @Args('id') id: string,
    @Args('notes', { nullable: true }) notes: string,
  ): Promise<ModerationQueue> {
    return this.moderationQueueService.reject(id, user, notes);
  }

  @Mutation(() => ModerationQueue)
  async deleteModerationItem(
    @CurrentUser() user: User,
    @Args('id') id: string,
    @Args('notes', { nullable: true }) notes: string,
  ): Promise<ModerationQueue> {
    return this.moderationQueueService.delete(id, user, notes);
  }
}