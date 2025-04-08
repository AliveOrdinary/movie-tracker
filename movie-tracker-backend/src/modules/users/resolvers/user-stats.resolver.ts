// src/modules/users/resolvers/user-stats.resolver.ts
import { Resolver, Query, Args, ResolveField, Parent } from '@nestjs/graphql';
import { Logger, UseGuards } from '@nestjs/common';
import { UserStatsService } from '../service/user-stats.service';
import { User } from '../entities/user.entity';
import { UserStats } from '../dto/user-stats.dto';
import { AuthGuard } from '../../../auth/guards/auth.guard';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { Public } from '../../../auth/guards/auth.guard';

@Resolver(() => User)
export class UserStatsResolver {
  private readonly logger = new Logger(UserStatsResolver.name);

  constructor(private readonly userStatsService: UserStatsService) {}

  @Query(() => UserStats)
  @UseGuards(AuthGuard)
  async myStats(@CurrentUser() user: User): Promise<UserStats> {
    try {
      return this.userStatsService.getUserStats(user.id);
    } catch (error) {
      this.logger.error(`Error fetching stats for current user: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Query(() => UserStats)
  @Public()
  async userStats(@Args('userId') userId: string): Promise<UserStats> {
    try {
      return this.userStatsService.getUserStats(userId);
    } catch (error) {
      this.logger.error(`Error fetching stats for user ${userId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Add this field resolver to the User entity to access stats from user queries
  @ResolveField(() => UserStats)
  async stats(@Parent() user: User): Promise<UserStats> {
    try {
      return this.userStatsService.getUserStats(user.id);
    } catch (error) {
      this.logger.error(`Error resolving stats for user ${user.id}: ${error.message}`, error.stack);
      throw error;
    }
  }
}