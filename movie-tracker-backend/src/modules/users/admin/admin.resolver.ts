//src/modules/users/admin/admin.resolver.ts
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../common/enums/roles.enum';
import { User } from '../entities/user.entity';
import { UsersService } from '../users.service';

@Resolver()
@Roles(UserRole.ADMIN)  // All operations in this resolver require admin role
export class AdminResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => [User])
  async getAllUsers(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Mutation(() => Boolean)
  async deleteUser(
    @Args('userId') userId: string
  ): Promise<boolean> {
    return this.usersService.remove(userId);
  }

  @Mutation(() => User)
  async updateUserRole(
    @Args('userId') userId: string,
    @Args('role') role: UserRole
  ): Promise<User> {
    return this.usersService.updateRole(userId, role);
  }
}