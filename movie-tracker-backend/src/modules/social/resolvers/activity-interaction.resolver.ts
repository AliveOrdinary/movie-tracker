// src/modules/social/resolvers/activity-interaction.resolver.ts
import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ActivityComment } from '../entities/activity-comment.entity';
import { ActivityReaction } from '../entities/activity-reaction.entity';
import { ActivityInteractionService } from '../services/activity-interaction.service';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { AuthGuard } from '../../../auth/guards/auth.guard';
import { CreateCommentInput } from '../dto/create-comment.input';
import { CreateReactionInput } from '../dto/create-reaction.input';

@Resolver()
@UseGuards(AuthGuard)
export class ActivityInteractionResolver {
  constructor(private readonly interactionService: ActivityInteractionService) {}

  // Comment mutations
  @Mutation(() => ActivityComment)
  async addActivityComment(
    @CurrentUser() user: User,
    @Args('input') input: CreateCommentInput,
  ): Promise<ActivityComment> {
    return this.interactionService.addComment({
      ...input,
      userId: user.id,
    });
  }

  @Mutation(() => Boolean)
  async deleteActivityComment(
    @CurrentUser() user: User,
    @Args('id') id: string,
  ): Promise<boolean> {
    return this.interactionService.deleteComment(id, user.id);
  }

  @Mutation(() => ActivityComment)
  async updateActivityComment(
    @CurrentUser() user: User,
    @Args('id') id: string,
    @Args('content') content: string,
  ): Promise<ActivityComment> {
    return this.interactionService.updateComment(id, content, user.id);
  }

  // Reaction mutations
  @Mutation(() => ActivityReaction)
  async addActivityReaction(
    @CurrentUser() user: User,
    @Args('input') input: CreateReactionInput,
  ): Promise<ActivityReaction> {
    return this.interactionService.addReaction({
      ...input,
      userId: user.id,
    });
  }

  @Mutation(() => Boolean)
  async removeActivityReaction(
    @CurrentUser() user: User,
    @Args('activityId') activityId: string,
  ): Promise<boolean> {
    return this.interactionService.removeReaction(activityId, user.id);
  }

  // Queries
  @Query(() => [ActivityComment])
  async activityComments(
    @Args('activityId') activityId: string,
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
  ): Promise<ActivityComment[]> {
    const [comments] = await this.interactionService.getActivityComments(activityId, page, limit);
    return comments;
  }

  @Query(() => Int)
  async activityCommentsCount(
    @Args('activityId') activityId: string,
  ): Promise<number> {
    return this.interactionService.getActivityCommentsCount(activityId);
  }

  @Query(() => [ActivityReaction])
  async activityReactions(
    @Args('activityId') activityId: string,
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
  ): Promise<ActivityReaction[]> {
    const [reactions] = await this.interactionService.getActivityReactions(activityId, page, limit);
    return reactions;
  }

  @Query(() => Int)
  async activityReactionsCount(
    @Args('activityId') activityId: string,
  ): Promise<number> {
    return this.interactionService.getActivityReactionsCount(activityId);
  }
}
