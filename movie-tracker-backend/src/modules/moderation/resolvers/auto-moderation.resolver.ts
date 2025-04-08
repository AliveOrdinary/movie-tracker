// src/modules/moderation/resolvers/auto-moderation.resolver.ts
import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AutoModerationService } from '../services/auto-moderation.service';
import { AutoModerationRule, RuleType, RuleAction } from '../entities/auto-moderation-rule.entity';
import { AutoModerationRuleResponse } from '../dto/moderation-response.dto';
import { CreateAutoModerationRuleInput, UpdateAutoModerationRuleInput } from '../dto/auto-moderation-rule.dto';
import { AuthGuard } from '../../../auth/guards/auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../../../common/enums';
import { ContentType } from '../entities/moderation-queue.entity';

@Resolver(() => AutoModerationRule)
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MODERATOR)
export class AutoModerationResolver {
  constructor(private readonly autoModerationService: AutoModerationService) {}

  @Query(() => AutoModerationRuleResponse)
  async autoModerationRules(
    @Args('contentType', { nullable: true, type: () => ContentType }) contentType?: ContentType,
    @Args('ruleType', { nullable: true, type: () => RuleType }) ruleType?: RuleType,
    @Args('isActive', { nullable: true }) isActive?: boolean,
    @Args('page', { nullable: true, type: () => Int }) page?: number,
    @Args('limit', { nullable: true, type: () => Int }) limit?: number,
  ): Promise<AutoModerationRuleResponse> {
    const [items, total] = await this.autoModerationService.findRules(
      contentType,
      ruleType,
      isActive,
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

  @Query(() => AutoModerationRule)
  async autoModerationRule(
    @Args('id') id: string,
  ): Promise<AutoModerationRule> {
    return this.autoModerationService.findRule(id);
  }

  @Mutation(() => AutoModerationRule)
  async createAutoModerationRule(
    @CurrentUser() user: User,
    @Args('input') input: CreateAutoModerationRuleInput,
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