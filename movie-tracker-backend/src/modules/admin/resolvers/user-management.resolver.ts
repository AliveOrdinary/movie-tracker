// src/modules/admin/resolvers/user-management.resolver.ts
import { Resolver, Query, Mutation, Args, Int, ObjectType, Field } from '@nestjs/graphql';
import { BulkUserRoleInput, BulkUserModerationInput, BulkOperationResult } from '../dto/bulk-operations.dto';
import { NotFoundException, UseGuards } from '@nestjs/common';
import { AdminService } from '../admin.service';
import { AuthGuard } from '../../../auth/guards/auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { UserRole } from 'src/common/enums';
import { User } from '../../users/entities/user.entity';
import { ModerationAction } from 'src/common/enums';

@ObjectType()
class PaginatedUsers {
  @Field(() => [User])
  users: User[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  totalPages: number;
}

@Resolver()
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class UserManagementResolver {
  constructor(private readonly adminService: AdminService) {}

  @Query(() => PaginatedUsers)
  async getAllUsers(
    @Args('page', { defaultValue: 1, type: () => Int }) page: number,
    @Args('limit', { defaultValue: 10, type: () => Int }) limit: number,
  ): Promise<PaginatedUsers> {
    // This should use the User repository directly to get all users with pagination
    const usersRepository = await this.adminService.getUsersRepository();
    const [users, total] = await usersRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' }
    });

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  @Query(() => PaginatedUsers)
  async searchUsers(
    @Args('query') query: string,
    @Args('page', { defaultValue: 1, type: () => Int }) page: number,
    @Args('limit', { defaultValue: 10, type: () => Int }) limit: number,
  ): Promise<PaginatedUsers> {
    const [users, total] = await this.adminService.searchUsers(query, page, limit);

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  @Mutation(() => User)
  async updateUserRole(
    @Args('userId') userId: string,
    @Args('role', { type: () => UserRole }) role: UserRole,
    @Args('add', { defaultValue: true }) add: boolean,
  ): Promise<User> {
    return this.adminService.setUserRole(userId, role, add);
  }

  @Mutation(() => User)
  async banUser(
    @CurrentUser() moderator: User,
    @Args('userId') userId: string,
    @Args('reason') reason: string,
  ): Promise<User> {
    await this.adminService.moderateUser(
      moderator,
      userId,
      ModerationAction.USER_BANNED,
      reason,
    );
    return this.adminService.banUser(userId, reason);
  }

  @Mutation(() => User)
  async unbanUser(
    @Args('userId') userId: string,
  ): Promise<User> {
    return this.adminService.unbanUser(userId);
  }

  @Mutation(() => User)
  async warnUser(
    @CurrentUser() moderator: User,
    @Args('userId') userId: string,
    @Args('reason') reason: string,
  ): Promise<User> {
    const log = await this.adminService.moderateUser(
      moderator,
      userId,
      ModerationAction.USER_WARNED,
      reason,
    );
    if(!log.targetUser) {
      throw new NotFoundException(`User not found for moderation log ${log.id}`);
    }
    return log.targetUser;
  }

  @Mutation(() => User)
  async suspendUser(
    @CurrentUser() moderator: User,
    @Args('userId') userId: string,
    @Args('reason') reason: string,
  ): Promise<User> {
    const log = await this.adminService.moderateUser(
      moderator,
      userId,
      ModerationAction.USER_SUSPENDED,
      reason,
    );
    if(!log.targetUser) {
      throw new NotFoundException(`User not found for moderation log ${log.id}`);
    }
    return log.targetUser;
  }

  @Mutation(() => Boolean)
  async deleteUser(
    @Args('userId') userId: string,
    @Args('keepContent', { defaultValue: true }) keepContent: boolean,
  ): Promise<boolean> {
    return this.adminService.deleteUser(userId, keepContent);
  }

  @Mutation(() => BulkOperationResult)
  async bulkUpdateUserRoles(
    @Args('input') input: BulkUserRoleInput,
  ): Promise<BulkOperationResult> {
    const result = await this.adminService.bulkSetUserRole(
      input.userIds,
      input.role,
      input.add
    );
    
    return {
      successCount: result.successCount,
      failureCount: result.failureCount,
      errors: result.errors.length > 0 ? result.errors : undefined
    };
  }

  @Mutation(() => BulkOperationResult)
  async bulkModerateUsers(
    @CurrentUser() moderator: User,
    @Args('input') input: BulkUserModerationInput,
  ): Promise<BulkOperationResult> {
    const result = await this.adminService.bulkModerateUsers(
      moderator,
      input.userIds,
      input.action,
      input.reason
    );
    
    return {
      successCount: result.successCount,
      failureCount: result.failureCount,
      errors: result.errors.length > 0 ? result.errors : undefined
    };
  }
}