//src/modules/users/users.resolver.ts
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { FirebaseAuthGuard } from '../../auth/guards/firebase-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CreateUserInput, UpdateUserInput } from './dto';
import { UserRole } from '../../common/enums/roles.enum';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => [User])
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async users(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Query(() => User)
  @UseGuards(FirebaseAuthGuard)
  async me(@CurrentUser() user: User): Promise<User> {
    return user;
  }

  @Query(() => User, { nullable: true })
  async userByUsername(
    @Args('username') username: string,
  ): Promise<User | null> {
    return this.usersService.findByUsername(username);
  }

  @Mutation(() => User)
  @UseGuards(FirebaseAuthGuard)
  async updateUser(
    @CurrentUser() user: User,
    @Args('input') input: UpdateUserInput,
  ): Promise<User> {
    return this.usersService.update(user.id, input);
  }

  @Mutation(() => Boolean)
  @UseGuards(FirebaseAuthGuard)
  @Roles(UserRole.ADMIN)
  async removeUser(
    @Args('id') id: string,
  ): Promise<boolean> {
    return this.usersService.remove(id);
  }
}