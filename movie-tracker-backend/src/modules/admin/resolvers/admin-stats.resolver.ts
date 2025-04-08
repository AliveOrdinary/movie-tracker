// src/modules/admin/resolvers/admin-stats.resolver.ts
import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AdminService } from '../admin.service';
import { AuthGuard } from '../../../auth/guards/auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { UserRole } from 'src/common/enums';
import { AdminDashboardStats } from '../dto/admin-dashboard-stats.dto';
import { AdminContentStats } from '../dto/admin-content-stats.dto';
import { AdminUserStats } from '../dto/admin-user-stats.dto';
import { UserRoleStats } from '../dto/user-role-stats.dto';
import { ReportStats } from '../dto/report-stats.type';

@Resolver()
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminStatsResolver {
  constructor(private readonly adminService: AdminService) {}

  @Query(() => AdminDashboardStats)
  async adminDashboardStats(): Promise<AdminDashboardStats> {
    return this.adminService.getDashboardStats();
  }

  @Query(() => AdminContentStats)
  async adminContentStats(): Promise<AdminContentStats> {
    return this.adminService.getContentStats();
  }

  @Query(() => AdminUserStats)
  async adminUserStats(): Promise<AdminUserStats> {
    return this.adminService.getUserStats();
  }

  @Query(() => [UserRoleStats])
  async userRoleStats(): Promise<UserRoleStats[]> {
    return this.adminService.getUserRoleStats();
  }

  @Query(() => ReportStats)
  async reportStats(): Promise<ReportStats> {
    return this.adminService.getReportStats();
  }

  @Query(() => Int)
  async pendingReportsCount(): Promise<number> {
    return this.adminService.getPendingReportsCount();
  }
}