// src/modules/moderation/moderation.resolver.ts
import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ModerationQueueService } from './services/moderation-queue.service';
import { AutoModerationService } from './services/auto-moderation.service';
import { UserReputationService } from './services/user-reputation.service';
import { ModerationService } from './moderation.service';
import { ModerationQueue, ContentType, ModerationStatus, ModerationPriority } from './entities/moderation-queue.entity';
import { AutoModerationRule, RuleType, RuleAction } from './entities/auto-moderation-rule.entity';
import { UserReputation, ReputationLevel } from './entities/user-reputation.entity';
import { Report } from './entities/report.entity';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { UserRole, ReportResolution } from '../../common/enums';
import {
  CreateModerationQueueItemInput,
  UpdateModerationQueueItemInput,
} from './dto/moderation-queue.dto';
import {
  ModerationQueueResponse,
  ModerationStatistics,
} from './dto/moderation-response.dto';
import { ReportResponse } from './dto/report-response.dto';

// Ensure the class is properly initialized
import {
  CreateAutoModerationRuleInput,
  UpdateAutoModerationRuleInput,
  AutoModerationRuleResponse,
} from './dto/auto-moderation-rule.dto';
import {
  UpdateUserReputationInput,
  ReputationAdjustmentInput,
  UserReputationResponse,
} from './dto/user-reputation.dto';

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
  async getNextModerationItem(
    @CurrentUser() user: User,
  ): Promise<ModerationQueue | null> {
    return this.moderationQueueService.getNextItemForModeration(user);
  }

  @Query(() => ModerationQueue)
  async moderationQueueItem(
    @Args('id') id: string,
  ): Promise<ModerationQueue> {
    return this.moderationQueueService.findOne(id);
  }

  @Query(() => ModerationStatistics)
  async moderationStatistics(): Promise<ModerationStatistics> {
    const stats = await this.moderationQueueService.getStatistics();
    // Create an instance of ModerationStatistics which will have the getter methods
    const result = new ModerationStatistics();
    
    // Set all the required properties
    result.pendingCount = stats.pendingCount;
    result.inReviewCount = stats.inReviewCount;
    result.todayResolvedCount = stats.todayResolvedCount;
    result.totalResolvedCount = stats.totalResolvedCount;
    result.autoFlaggedCount = stats.autoFlaggedCount;
    result.averageResolutionTimeMinutes = stats.averageResolutionTimeMinutes;
    
    return result;
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

@Resolver(() => AutoModerationRule)
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AutoModerationRuleResolver {
  constructor(private readonly autoModerationService: AutoModerationService) {}

  @Query(() => AutoModerationRuleResponse)
  async autoModerationRules(
    @Args('contentType', { type: () => ContentType, nullable: true }) contentType?: ContentType,
    @Args('ruleType', { type: () => RuleType, nullable: true }) ruleType?: RuleType,
    @Args('isActive', { nullable: true }) isActive?: boolean,
    @Args('page', { type: () => Int, nullable: true, defaultValue: 1 }) page?: number,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 10 }) limit?: number,
  ): Promise<AutoModerationRuleResponse> {
    const [items, total] = await this.autoModerationService.findRules(
      contentType,
      ruleType,
      isActive,
      page,
      limit,
    );
    
    return {
      items,
      total,
      page: page || 1,
      totalPages: Math.ceil(total / (limit || 10)),
      limit: limit || 10,
    };
  }

  @Query(() => AutoModerationRule)
  async autoModerationRule(
    @Args('id') id: string,
  ): Promise<AutoModerationRule> {
    return this.autoModerationService.findRule(id);
  }

  @Mutation(() => AutoModerationRule)
  async createAutoModerationRule(
    @Args('input') input: CreateAutoModerationRuleInput,
    @CurrentUser() user: User,
  ): Promise<AutoModerationRule> {
    return this.autoModerationService.createRule(input, user);
  }

  @Mutation(() => AutoModerationRule)
  async updateAutoModerationRule(
    @Args('input') input: UpdateAutoModerationRuleInput,
  ): Promise<AutoModerationRule> {
    return this.autoModerationService.updateRule(input);
  }

  @Mutation(() => Boolean)
  async deleteAutoModerationRule(
    @Args('id') id: string,
  ): Promise<boolean> {
    return this.autoModerationService.deleteRule(id);
  }
}

@Resolver(() => UserReputation)
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MODERATOR)
export class UserReputationResolver {
  constructor(private readonly userReputationService: UserReputationService) {}

  @Query(() => UserReputation)
  async userReputation(
    @Args('userId') userId: string,
  ): Promise<UserReputation> {
    return this.userReputationService.findByUserId(userId);
  }

  @Query(() => UserReputationResponse)
  async userReputationsByLevel(
    @Args('level', { type: () => ReputationLevel }) level: ReputationLevel,
    @Args('page', { type: () => Int, nullable: true, defaultValue: 1 }) page?: number,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 10 }) limit?: number,
  ): Promise<UserReputationResponse> {
    const [items, total] = await this.userReputationService.findAllByLevel(level, page, limit);
    
    return {
      items,
      total,
      page: page || 1,
      totalPages: Math.ceil(total / (limit || 10)),
      limit: limit || 10,
    };
  }

  @Query(() => UserReputationResponse)
  async userReputationsByScoreRange(
    @Args('minScore', { type: () => Int }) minScore: number,
    @Args('maxScore', { type: () => Int }) maxScore: number,
    @Args('page', { type: () => Int, nullable: true, defaultValue: 1 }) page?: number,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 10 }) limit?: number,
  ): Promise<UserReputationResponse> {
    const [items, total] = await this.userReputationService.findAllByScoreRange(
      minScore,
      maxScore,
      page,
      limit,
    );
    
    return {
      items,
      total,
      page: page || 1,
      totalPages: Math.ceil(total / (limit || 10)),
      limit: limit || 10,
    };
  }

  @Mutation(() => UserReputation)
  @Roles(UserRole.ADMIN)
  async updateUserReputation(
    @Args('input') input: UpdateUserReputationInput,
  ): Promise<UserReputation> {
    return this.userReputationService.updateReputation(input);
  }

  @Mutation(() => UserReputation)
  @Roles(UserRole.ADMIN)
  async adjustUserReputationScore(
    @Args('input') input: ReputationAdjustmentInput,
  ): Promise<UserReputation> {
    return this.userReputationService.adjustReputationScore(input);
  }
}

@Resolver(() => Report)
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MODERATOR)
export class ReportResolver {
  constructor(
    private readonly moderationQueueService: ModerationQueueService,
    private readonly moderationService: ModerationService
  ) {}

  @Query(() => ReportResponse)
  async reportedContent(
    @Args('page', { type: () => Int, nullable: true, defaultValue: 1 }) page?: number,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 10 }) limit?: number,
  ): Promise<ReportResponse> {
    const [items, total] = await this.moderationService.getReportedContent(page || 1, limit || 10);
    
    return {
      items,
      total,
      page: page || 1,
      limit: limit || 10,
      totalPages: Math.ceil(total / (limit || 10))
    };
  }
  
  @Query(() => Report, { nullable: true })
  async reportById(@Args('id') id: string): Promise<Report | null> {
    try {
      // Implementation would need to be added to the service
      const report = await this.moderationService.findReportById(id);
      return report;
    } catch (error) {
      if (error.message.includes('not found')) {
        return null;
      }
      throw error;
    }
  }

  @Mutation(() => ModerationQueue)
  async reportContent(
    @CurrentUser() user: User,
    @Args('contentType', { type: () => ContentType }) contentType: ContentType,
    @Args('contentId') contentId: string,
    @Args('reason') reason: string,
  ): Promise<ModerationQueue> {
    return this.moderationQueueService.create({
      contentType,
      contentId,
      moderationNotes: `Reported by user ${user.id}: ${reason}`,
      priority: ModerationPriority.MEDIUM,
    });
  }
  
  @Mutation(() => Report)
  async resolveReport(
    @CurrentUser() moderator: User,
    @Args('reportId') reportId: string,
    @Args('resolution', { type: () => ReportResolution }) resolution: ReportResolution,
    @Args('notes', { nullable: true }) notes?: string,
  ): Promise<Report> {
    return this.moderationService.resolveReport(reportId, resolution, moderator, notes);
  }
}