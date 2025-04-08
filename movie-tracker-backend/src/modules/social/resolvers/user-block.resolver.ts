// src/modules/social/resolvers/user-block.resolver.ts
import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UserBlock } from '../entities/user-block.entity';
import { UserBlockService } from '../services/user-block.service';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { AuthGuard } from '../../../auth/guards/auth.guard';
import { UserBlockResponse } from '../dto/user-block.dto';

@Resolver(() => UserBlock)
@UseGuards(AuthGuard)
export class UserBlockResolver {
  constructor(private readonly userBlockService: UserBlockService) {}

  @Mutation(() => UserBlock)
  async blockUser(
    @CurrentUser() user: User,  
    @Args('userId') userId: string,
    @Args('reason', { nullable: true }) reason: string,
  ): Promise<UserBlock> {
    return this.userBlockService.blockUser(user.id, userId, reason);
  }

  @Mutation(() => Boolean)
  async unblockUser(
    @CurrentUser() user: User,
    @Args('userId') userId: string,
  ): Promise<boolean> {
    return this.userBlockService.unblockUser(user.id, userId);
  }

  @Query(() => UserBlockResponse)
  async blockedUsers(
    @CurrentUser() user: User,
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
  ): Promise<UserBlockResponse> {
    const [items, total] = await this.userBlockService.getBlockedUsers(user.id, page, limit);
    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  @Query(() => Boolean)
  async isUserBlocked(
    @CurrentUser() user: User,
    @Args('userId') userId: string,
  ): Promise<boolean> {
    return this.userBlockService.isUserBlocked(user.id, userId);
  }

  @Query(() => Int)
  async blockedUsersCount(
    @CurrentUser() user: User,
  ): Promise<number> {
    return this.userBlockService.getBlockedUsersCount(user.id);
  }
}
