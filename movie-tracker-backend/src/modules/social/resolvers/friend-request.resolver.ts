// src/modules/social/resolvers/friend-request.resolver.ts
import { Resolver, Query, Mutation, Args, Int, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards, Logger, NotFoundException, ForbiddenException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { FriendRequest } from '../entities/friend-request.entity';
import { FriendRequestService } from '../services/friend-request.service';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { AuthGuard } from '../../../auth/guards/auth.guard';
import { FriendRequestStatus } from '../../../common/enums';
import { FriendRequestsResponse } from '../dto/friend-request.dto';

@Resolver(() => FriendRequest)
@UseGuards(AuthGuard)
export class FriendRequestResolver {
  private readonly logger = new Logger(FriendRequestResolver.name);
  
  constructor(private readonly friendRequestService: FriendRequestService) {}

  @Mutation(() => FriendRequest)
  async sendFriendRequest(
    @CurrentUser() user: User,
    @Args('userId') userId: string,
  ): Promise<FriendRequest> {
    try {
      return await this.friendRequestService.sendFriendRequest(user.id, userId);
    } catch (error) {
      this.logger.error(`Error sending friend request to ${userId}: ${error.message}`, error.stack);
      
      if (error instanceof NotFoundException || 
          error instanceof ConflictException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Failed to send friend request');
    }
  }

  @Mutation(() => FriendRequest)
  async acceptFriendRequest(
    @CurrentUser() user: User,
    @Args('requestId') requestId: string,
  ): Promise<FriendRequest> {
    try {
      return await this.friendRequestService.updateFriendRequestStatus(requestId, user.id, FriendRequestStatus.ACCEPTED);
    } catch (error) {
      this.logger.error(`Error accepting friend request ${requestId}: ${error.message}`, error.stack);
      
      if (error instanceof NotFoundException || 
          error instanceof ForbiddenException || 
          error instanceof ConflictException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Failed to accept friend request');
    }
  }

  @Mutation(() => FriendRequest)
  async rejectFriendRequest(
    @CurrentUser() user: User,
    @Args('requestId') requestId: string,
  ): Promise<FriendRequest> {
    try {
      return await this.friendRequestService.updateFriendRequestStatus(requestId, user.id, FriendRequestStatus.REJECTED);
    } catch (error) {
      this.logger.error(`Error rejecting friend request ${requestId}: ${error.message}`, error.stack);
      
      if (error instanceof NotFoundException || 
          error instanceof ForbiddenException || 
          error instanceof ConflictException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Failed to reject friend request');
    }
  }

  @Mutation(() => Boolean)
  async cancelFriendRequest(
    @CurrentUser() user: User,
    @Args('requestId') requestId: string,
  ): Promise<boolean> {
    try {
      return await this.friendRequestService.cancelFriendRequest(requestId, user.id);
    } catch (error) {
      this.logger.error(`Error canceling friend request ${requestId}: ${error.message}`, error.stack);
      
      if (error instanceof NotFoundException || 
          error instanceof ForbiddenException || 
          error instanceof ConflictException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Failed to cancel friend request');
    }
  }

  @Mutation(() => Boolean)
  async removeFriend(
    @CurrentUser() user: User,
    @Args('userId') userId: string,
  ): Promise<boolean> {
    try {
      return await this.friendRequestService.removeFriend(user.id, userId);
    } catch (error) {
      this.logger.error(`Error removing friend ${userId}: ${error.message}`, error.stack);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Failed to remove friend');
    }
  }

  @Query(() => FriendRequestsResponse)
  async receivedFriendRequests(
    @CurrentUser() user: User,
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
  ): Promise<FriendRequestsResponse> {
    try {
      const [items, total] = await this.friendRequestService.getReceivedFriendRequests(user.id, page, limit);
      return {
        items,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      this.logger.error(`Error getting received friend requests: ${error.message}`, error.stack);
      return {
        items: [],
        total: 0,
        page,
        totalPages: 0
      };
    }
  }

  @Query(() => FriendRequestsResponse)
  async sentFriendRequests(
    @CurrentUser() user: User,
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
  ): Promise<FriendRequestsResponse> {
    try {
      const [items, total] = await this.friendRequestService.getSentFriendRequests(user.id, page, limit);
      return {
        items,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      this.logger.error(`Error getting sent friend requests: ${error.message}`, error.stack);
      return {
        items: [],
        total: 0,
        page,
        totalPages: 0
      };
    }
  }

  @Query(() => [User])
  async userFriends(
    @Args('userId') userId: string,
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
  ): Promise<User[]> {
    try {
      const [friends] = await this.friendRequestService.getUserFriends(userId, page, limit);
      return friends;
    } catch (error) {
      this.logger.error(`Error getting user friends for user ${userId}: ${error.message}`, error.stack);
      return [];
    }
  }

  @Query(() => Int)
  async friendCount(
    @Args('userId') userId: string,
  ): Promise<number> {
    try {
      return await this.friendRequestService.getFriendsCount(userId);
    } catch (error) {
      this.logger.error(`Error getting friend count for user ${userId}: ${error.message}`, error.stack);
      return 0;
    }
  }

  @Query(() => Boolean)
  async areFriends(
    @CurrentUser() user: User,
    @Args('userId') userId: string,
  ): Promise<boolean> {
    try {
      return await this.friendRequestService.checkAreFriends(user.id, userId);
    } catch (error) {
      this.logger.error(`Error checking friend status with ${userId}: ${error.message}`, error.stack);
      return false;
    }
  }

  @Query(() => FriendRequest, { nullable: true })
  async getFriendRequestStatus(
    @CurrentUser() user: User,
    @Args('userId') userId: string,
  ): Promise<FriendRequest | null> {
    try {
      return await this.friendRequestService.getFriendRequestStatus(user.id, userId);
    } catch (error) {
      this.logger.error(`Error getting friend request status with ${userId}: ${error.message}`, error.stack);
      return null;
    }
  }

  // Field Resolvers
  @ResolveField(() => User, { nullable: true })
  async sender(@Parent() friendRequest: FriendRequest): Promise<User | null> {
    try {
      return friendRequest.sender;
    } catch (error) {
      this.logger.error(`Error resolving sender field: ${error.message}`, error.stack);
      return null;
    }
  }

  @ResolveField(() => User, { nullable: true })
  async receiver(@Parent() friendRequest: FriendRequest): Promise<User | null> {
    try {
      if (!friendRequest.recipient) {
        return null;
      }
      return friendRequest.recipient;
    } catch (error) {
      this.logger.error(`Error resolving receiver field: ${error.message}`, error.stack);
      return null;
    }
  }
}
