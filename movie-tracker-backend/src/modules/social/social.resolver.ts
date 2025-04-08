// src/modules/social/social.resolver.ts
import { Resolver, Query, Mutation, Args, Int, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards, Logger, InternalServerErrorException, NotFoundException, ConflictException } from '@nestjs/common';
import { SocialService } from './social.service';
import { UserFollow } from './entities/user-follow.entity';
import { Activity } from './entities/activity.entity';
import { User } from '../users/entities/user.entity';
import { ActivityResponse } from './dto/activity-response';
import { FollowUserInput } from './dto/follow-user.input';
import { ActivityFiltersInput } from './dto/activity-filters.input';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@Resolver(() => UserFollow)
@UseGuards(AuthGuard)
export class FollowsResolver {
  private readonly logger = new Logger(FollowsResolver.name);

  constructor(private readonly socialService: SocialService) {}

  @Mutation(() => UserFollow)
  async followUser(
    @CurrentUser() user: User,
    @Args('input') input: FollowUserInput,
  ): Promise<UserFollow> {
    try {
      return await this.socialService.followUser(user.id, input.userId);
    } catch (error) {
      this.logger.error(`Error following user: ${error.message}`, error.stack);
      
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Failed to follow user');
    }
  }

  @Mutation(() => Boolean)
  async unfollowUser(
    @CurrentUser() user: User,
    @Args('userId') userId: string,
  ): Promise<boolean> {
    try {
      return await this.socialService.unfollowUser(user.id, userId);
    } catch (error) {
      this.logger.error(`Error unfollowing user: ${error.message}`, error.stack);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Failed to unfollow user');
    }
  }

  @Query(() => [User])
  async userFollowers(
    @Args('userId') userId: string,
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
  ): Promise<User[]> {
    try {
      const [followers] = await this.socialService.getFollowers(userId, page, limit);
      return followers;
    } catch (error) {
      this.logger.error(`Error getting user followers: ${error.message}`, error.stack);
      return [];
    }
  }

  @Query(() => [User])
  async userFollowing(
    @Args('userId') userId: string,
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
  ): Promise<User[]> {
    try {
      const [following] = await this.socialService.getFollowing(userId, page, limit);
      return following;
    } catch (error) {
      this.logger.error(`Error getting user following: ${error.message}`, error.stack);
      return [];
    }
  }

  @Query(() => Int)
  async followerCount(
    @Args('userId') userId: string,
  ): Promise<number> {
    try {
      return await this.socialService.getFollowersCount(userId);
    } catch (error) {
      this.logger.error(`Error getting follower count: ${error.message}`, error.stack);
      return 0;
    }
  }

  @Query(() => Int)
  async followingCount(
    @Args('userId') userId: string,
  ): Promise<number> {
    try {
      return await this.socialService.getFollowingCount(userId);
    } catch (error) {
      this.logger.error(`Error getting following count: ${error.message}`, error.stack);
      return 0;
    }
  }

  @Query(() => Boolean)
  async isFollowing(
    @CurrentUser() currentUser: User,
    @Args('userId') userId: string,
  ): Promise<boolean> {
    try {
      return await this.socialService.isFollowing(currentUser.id, userId);
    } catch (error) {
      this.logger.error(`Error checking following status: ${error.message}`, error.stack);
      return false;
    }
  }
}

@Resolver(() => Activity)
@UseGuards(AuthGuard)
export class ActivityResolver {
  private readonly logger = new Logger(ActivityResolver.name);

  constructor(private readonly socialService: SocialService) {}

  @Query(() => ActivityResponse)
  async userActivity(
    @Args('userId') userId: string,
    @Args('filters', { nullable: true }) filters?: ActivityFiltersInput,
  ): Promise<ActivityResponse> {
    try {
      const [items, total] = await this.socialService.getUserActivity(userId, filters);
      const page = filters?.page || 1;
      const limit = filters?.limit || 20;
      
      return {
        items,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      this.logger.error(`Error getting user activity: ${error.message}`, error.stack);
      return {
        items: [],
        total: 0,
        page: filters?.page || 1,
        totalPages: 0
      };
    }
  }

  @Query(() => ActivityResponse)
  async activityFeed(
    @CurrentUser() user: User,
    @Args('filters', { nullable: true }) filters?: ActivityFiltersInput,
  ): Promise<ActivityResponse> {
    try {
      const [items, total] = await this.socialService.getFeedActivity(user.id, filters);
      const page = filters?.page || 1;
      const limit = filters?.limit || 20;
      
      return {
        items,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      this.logger.error(`Error getting activity feed: ${error.message}`, error.stack);
      return {
        items: [],
        total: 0,
        page: filters?.page || 1,
        totalPages: 0
      };
    }
  }

  @ResolveField('user', () => User, { nullable: true })
  async getUser(@Parent() activity: Activity): Promise<User | null> {
    try {
      return activity.user || {} as User;
    } catch (error) {
      this.logger.error(`Error resolving user field: ${error.message}`, error.stack);
      return {} as User;
    }
  }

  @ResolveField('targetUser', () => User, { nullable: true })
  async getTargetUser(@Parent() activity: Activity): Promise<User | null> {
    try {
      return activity.targetUser || null;
    } catch (error) {
      this.logger.error(`Error resolving targetUser field: ${error.message}`, error.stack);
      return null;
    }
  }
}

// Add field resolvers for User entity (to be added to the appropriate file)
@Resolver(() => User)
export class UserSocialFieldsResolver {
  private readonly logger = new Logger(UserSocialFieldsResolver.name);
  
  constructor(private readonly socialService: SocialService) {}

  @ResolveField(() => Int)
  async followerCount(@Parent() user: User): Promise<number> {
    try {
      return await this.socialService.getFollowersCount(user.id);
    } catch (error) {
      this.logger.error(`Error resolving followerCount field: ${error.message}`, error.stack);
      return 0;
    }
  }

  @ResolveField(() => Int)
  async followingCount(@Parent() user: User): Promise<number> {
    try {
      return await this.socialService.getFollowingCount(user.id);
    } catch (error) {
      this.logger.error(`Error resolving followingCount field: ${error.message}`, error.stack);
      return 0;
    }
  }

  @ResolveField(() => Boolean)
  async isFollowing(
    @Parent() user: User,
    @CurrentUser() currentUser: User,
  ): Promise<boolean> {
    try {
      if (!currentUser) return false;
      return await this.socialService.isFollowing(currentUser.id, user.id);
    } catch (error) {
      this.logger.error(`Error resolving isFollowing field: ${error.message}`, error.stack);
      return false;
    }
  }
}