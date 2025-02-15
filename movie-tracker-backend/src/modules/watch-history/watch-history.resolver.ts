// src/modules/watch-history/watch-history.resolver.ts
import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { WatchHistoryService } from './watch-history.service';
import { WatchHistory, WatchType } from './entities/watch-history.entity';
import { CreateWatchInput } from './dto/create-watch.input';
import { UpdateWatchInput } from './dto/update-watch.input';
import { FirebaseAuthGuard } from '../../auth/guards/firebase-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { WatchHistoryStats } from './types/watch-history-stats.type';

@Resolver(() => WatchHistory)
@UseGuards(FirebaseAuthGuard)
export class WatchHistoryResolver {
  constructor(private readonly watchHistoryService: WatchHistoryService) {}

  @Mutation(() => WatchHistory)
  async createWatch(
    @Args('input') input: CreateWatchInput,
    @CurrentUser() user: User,
  ): Promise<WatchHistory> {
    return this.watchHistoryService.create({
      ...input,
      userId: user.id
    });
  }

  @Query(() => [WatchHistory])
  async watchHistory(
    @CurrentUser() user: User,
    @Args('page', { nullable: true, defaultValue: 1 }) page: number,
    @Args('limit', { nullable: true, defaultValue: 10 }) limit: number,
  ): Promise<WatchHistory[]> {
    const [watches] = await this.watchHistoryService.getUserWatchHistory(user.id, page, limit);
    return watches;
  }

  @Query(() => Int)
  async watchHistoryCount(
    @CurrentUser() user: User,
    @Args('page', { nullable: true, defaultValue: 1 }) page: number,
    @Args('limit', { nullable: true, defaultValue: 10 }) limit: number,
  ): Promise<number> {
    const [, count] = await this.watchHistoryService.getUserWatchHistory(user.id, page, limit);
    return count;
  }

  @Query(() => WatchHistory)
  async watch(
    @Args('id') id: string,
    @CurrentUser() user: User,
  ): Promise<WatchHistory> {
    return this.watchHistoryService.findOne(id, user);
  }

  @Mutation(() => WatchHistory)
  async updateWatch(
    @Args('id') id: string,
    @Args('input') input: UpdateWatchInput,
  ): Promise<WatchHistory> {
    return this.watchHistoryService.update(id, input);
  }

  @Mutation(() => Boolean)
  async deleteWatch(
    @Args('id') id: string,
  ): Promise<boolean> {
    return this.watchHistoryService.remove(id);
  }

  @Query(() => WatchHistoryStats)
  async watchStats(
    @CurrentUser() user: User,
  ): Promise<WatchHistoryStats> {
    return this.watchHistoryService.getStats(user.id);
  }

  @Query(() => WatchHistoryStats)
  async userWatchStats(
    @Args('userId') userId: string,
  ): Promise<WatchHistoryStats> {
    return this.watchHistoryService.getStats(userId);
  }
}