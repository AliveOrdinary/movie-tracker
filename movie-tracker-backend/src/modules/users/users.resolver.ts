//src/modules/users/users.resolver.ts
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { Logger, UseGuards, } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CreateUserInput, UpdateUserInput } from './dto';
import { UserRole } from 'src/common/enums';

@Resolver(() => User)
export class UsersResolver {
  private readonly logger = new Logger(UsersResolver.name);

  constructor(private readonly usersService: UsersService) {}

  @Query(() => [User])
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async users(): Promise<User[]> {
    try {
      return this.usersService.findAll();
    } catch (error) {
      this.logger.error(`Error fetching all users: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Query(() => User)
  @UseGuards(AuthGuard)
  async me(@CurrentUser() user: User): Promise<User> {
    try {
      // user is already populated by the AuthGuard
      return user;
    } catch (error) {
      this.logger.error(`Error fetching current user: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Query(() => User, { nullable: true })
  async userByUsername(
    @Args('username') username: string,
  ): Promise<User | null> {
    try {
      return this.usersService.findByUsername(username);
    } catch (error) {
      this.logger.error(`Error fetching user by username ${username}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Mutation(() => User)
  @UseGuards(AuthGuard)
  async updateUser(
    @CurrentUser() user: User,
    @Args('input') input: UpdateUserInput,
  ): Promise<User> {
    try {
      return this.usersService.update(user.id, input);
    } catch (error) {
      this.logger.error(`Error updating user ${user.id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Mutation(() => Boolean)
  @UseGuards(AuthGuard)
  @Roles(UserRole.ADMIN)
  async removeUser(
    @Args('id') id: string,
  ): Promise<boolean> {
    try {
      return this.usersService.remove(id);
    } catch (error) {
      this.logger.error(`Error removing user ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }
}