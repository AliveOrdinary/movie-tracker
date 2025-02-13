//src/modules/admin/resolvers/user-management.resolver.ts
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UserManagementService } from '../services/user-management.service';
import { User } from '../../users/entities/user.entity';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../common/enums/roles.enum';
import {
  UpdateUserRoleInput,
  BanUserInput,
  SearchUsersInput,
  PaginatedUsers,
} from '../dto/user-management.dto';

@Resolver()
@UseGuards(AuthGuard)
@Roles(UserRole.ADMIN)
export class UserManagementResolver {
  constructor(private readonly userManagementService: UserManagementService) {}

  @Query(() => PaginatedUsers)
  async getAllUsers(
    @Args('page', { defaultValue: 1 }) page: number,
    @Args('limit', { defaultValue: 10 }) limit: number,
  ) {
    return this.userManagementService.getAllUsers(page, limit);
  }

  @Mutation(() => User)
  async updateUserRole(
    @Args('input') input: UpdateUserRoleInput,
  ) {
    return this.userManagementService.updateUserRole(input.userId, input.role);
  }

  @Mutation(() => User)
  async banUser(
    @Args('input') input: BanUserInput,
  ) {
    return this.userManagementService.banUser(input.userId, input.reason);
  }

  @Mutation(() => User)
  async unbanUser(
    @Args('userId') userId: string,
  ) {
    return this.userManagementService.unbanUser(userId);
  }

  @Query(() => PaginatedUsers)
  async searchUsers(
    @Args('input') input: SearchUsersInput,
  ) {
    return this.userManagementService.searchUsers(
      input.query,
      input.page,
      input.limit,
    );
  }
}
