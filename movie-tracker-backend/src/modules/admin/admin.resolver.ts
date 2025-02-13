//src/modules/admin/admin.resolver.ts
import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { ModerationLog, ModerationAction } from './entities/moderation-log.entity';
import { User } from '../users/entities/user.entity';
import { FirebaseAuthGuard } from '../../auth/guards/firebase-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/roles.enum';
import {
  CreateModerationLogInput,
  UpdateModerationLogInput,
  ModerationLogFiltersInput,
  CreateReportInput,
  ResolveReportInput,
  ReportFiltersInput,
  ReportStats,
} from './dto';

@Resolver(() => ModerationLog)
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MODERATOR)
export class AdminResolver {
  constructor(private readonly adminService: AdminService) {}

  @Query(() => [ModerationLog])
  async moderationLogs(
    @Args('filters', { nullable: true }) filters?: ModerationLogFiltersInput,
  ): Promise<ModerationLog[]> {
    const [logs] = await this.adminService.findAll(filters || {});
    return logs;
  }

  @Query(() => ModerationLog)
  async moderationLog(
    @Args('id') id: string,
  ): Promise<ModerationLog> {
    return this.adminService.findOne(id);
  }

  @Mutation(() => ModerationLog)
  async createModerationLog(
    @CurrentUser() moderator: User,
    @Args('input') input: CreateModerationLogInput,
  ): Promise<ModerationLog> {
    return this.adminService.create(moderator, input);
  }

  @Mutation(() => ModerationLog)
  async updateModerationLog(
    @Args('input') input: UpdateModerationLogInput,
  ): Promise<ModerationLog> {
    return this.adminService.update(input.id, input);
  }

  @Mutation(() => ModerationLog)
  async moderateUser(
    @CurrentUser() moderator: User,
    @Args('userId') userId: string,
    @Args('action', { type: () => ModerationAction }) action: ModerationAction,
    @Args('reason') reason: string,
  ): Promise<ModerationLog> {
    return this.adminService.moderateUser(moderator, userId, action, reason);
  }

  @Query(() => ReportStats)
  async reportStats(): Promise<ReportStats> {
    return this.adminService.getReportStats();
  }

  @Query(() => Int)
  async pendingReportsCount(): Promise<number> {
    return this.adminService.getPendingReportsCount();
  }

  @Mutation(() => ModerationLog)
  async resolveReport(
    @CurrentUser() moderator: User,
    @Args('input') input: ResolveReportInput,
  ): Promise<ModerationLog> {
    return this.adminService.resolveReport(moderator, input);
  }

  @Query(() => [ModerationLog])
  async userModerationHistory(
    @Args('userId') userId: string,
    @Args('skip', { type: () => Int, nullable: true }) skip?: number,
    @Args('take', { type: () => Int, nullable: true }) take?: number,
  ): Promise<ModerationLog[]> {
    const [logs] = await this.adminService.findAll({
      targetUserId: userId,
      skip,
      take,
    });
    return logs;
  }
}