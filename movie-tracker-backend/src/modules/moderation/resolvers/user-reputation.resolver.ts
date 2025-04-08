// src/modules/moderation/resolvers/user-reputation.resolver.ts
import { Resolver, Query, Mutation, Args, Int, Float } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UserReputationService } from '../services/user-reputation.service';
import { UserReputation, ReputationLevel } from '../entities/user-reputation.entity';
import { UserReputationResponse } from '../dto/moderation-response.dto';
import { UpdateUserReputationInput, ReputationAdjustmentInput } from '../dto/user-reputation.dto';
import { AuthGuard } from '../../../auth/guards/auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../../../common/enums';

@Resolver(() => UserReputation)
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MODERATOR)
export class UserReputationResolver {
  constructor(private readonly userReputationService: UserReputationService) {}

  @Query(() => UserReputation)
  async userReputation(
    @Args('userId') userId: string,
  ): Promise<UserReputation> {
    return this.userReputationService.findOrCreateForUser(userId);
  }

  @Query(() => UserReputationResponse)
  async userReputationsByLevel(
    @Args('level', { type: () => ReputationLevel }) level: ReputationLevel,
    @Args('page', { nullable: true, type: () => Int }) page?: number,
    @Args('limit', { nullable: true, type: () => Int }) limit?: number,
  ): Promise<UserReputationResponse> {
    const [items, total] = await this.userReputationService.findAllByLevel(
      level,
      page || 1,
      limit || 10,
    );
    
    return {
      items,
      total,
      page: page || 1,
      limit: limit || 10,
      totalPages: Math.ceil(total / (limit || 10)),
    };
  }

  @Query(() => UserReputationResponse)
  async userReputationsByScore(
    @Args('minScore', { type: () => Float }) minScore: number,
    @Args('maxScore', { type: () => Float }) maxScore: number,
    @Args('page', { nullable: true, type: () => Int }) page?: number,
    @Args('limit', { nullable: true, type: () => Int }) limit?: number,
  ): Promise<UserReputationResponse> {
    const [items, total] = await this.userReputationService.findAllByScoreRange(
      minScore,
      maxScore,
      page || 1,
      limit || 10,
    );
    
    return {
      items,
      total,
      page: page || 1,
      limit: limit || 10,
      totalPages: Math.ceil(total / (limit || 10)),
    };
  }

  @Mutation(() => UserReputation)
  async updateUserReputation(
    @Args('input') input: UpdateUserReputationInput,
  ): Promise<UserReputation> {
    return this.userReputationService.updateReputation(input);
  }

  @Mutation(() => UserReputation)
  async adjustUserReputationScore(
    @Args('input') input: ReputationAdjustmentInput,
  ): Promise<UserReputation> {
    return this.userReputationService.adjustReputationScore(input);
  }
}