// src/modules/admin/resolvers/audit-log.resolver.ts
import { Resolver, Query, Args, Int, ObjectType, Field } from '@nestjs/graphql';
import { UseGuards, Logger } from '@nestjs/common';
import { AuthGuard } from '../../../auth/guards/auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { UserRole } from '../../../common/enums';
import { AuditService } from '../services/audit.service';
import { AdminAuditLog } from '../entities/admin-audit-log.entity';
import { AuditLogFiltersInput, PaginatedAuditLogs } from '../dto/audit-log.dto';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';

@ObjectType()
class ActionFrequency {
  @Field(() => String)
  action: string;
  
  @Field(() => Int)
  count: number;
}

@Resolver(() => AdminAuditLog)
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AuditLogResolver {
  private readonly logger = new Logger(AuditLogResolver.name);

  constructor(private readonly auditService: AuditService) {}

  @Query(() => PaginatedAuditLogs)
  async adminAuditLogs(
    @Args('filter', { nullable: true }) filter?: AuditLogFiltersInput,
  ): Promise<PaginatedAuditLogs> {
    this.logger.log('Fetching admin audit logs');
    return this.auditService.getAuditLogs(filter || {});
  }

  @Query(() => [AdminAuditLog])
  async myRecentAdminActions(
    @CurrentUser() admin: User,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
  ): Promise<AdminAuditLog[]> {
    this.logger.log(`Fetching recent admin actions for user ${admin.id}`);
    return this.auditService.getRecentActionsByAdmin(admin.id, limit);
  }

  @Query(() => [AdminAuditLog])
  async entityModificationHistory(
    @Args('entityType') entityType: string,
    @Args('entityId') entityId: string,
  ): Promise<AdminAuditLog[]> {
    this.logger.log(`Fetching modification history for ${entityType} ${entityId}`);
    return this.auditService.getEntityModificationHistory(entityType, entityId);
  }

  @Query(() => [ActionFrequency])
  async adminActionFrequency(
    @Args('days', { type: () => Int, defaultValue: 30 }) days: number,
  ): Promise<ActionFrequency[]> {
    this.logger.log(`Fetching admin action frequency for the last ${days} days`);
    return this.auditService.getActionFrequencyAnalytics(days);
  }
}