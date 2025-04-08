// src/auth/auth.resolver.ts
import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { UseGuards, Inject } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from '../modules/users/entities/user.entity';
import { AuthGuard, Public } from './guards/auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { PasswordValidationPipe } from './pipes/password-validation.pipe';
import { GqlThrottlerGuard } from './guards/rate-limit.guard';
import { UserRole, ProfileVisibility, WatchlistDisplayMode, ActivityFeedFilter, ReviewsSortOrder } from '../common/enums';
import {
  InitiatePasswordResetInput,
  ChangePasswordInput,
  PasswordResetVerificationResult,
  LoginInput,
  LoginResponse,
  ResetPasswordInput,
} from './dto';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  // Removed the normalizeUserEnums function as all enum values are now uppercase in the database

  @Query(() => User)
  @UseGuards(AuthGuard)
  async me(@CurrentUser() user: User): Promise<User> {
    return user;
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlThrottlerGuard)
  async initiatePasswordReset(
    @Args('input') input: InitiatePasswordResetInput,
  ): Promise<boolean> {
    await this.authService.initiatePasswordReset(input.email);
    return true;
  }

  @Mutation(() => PasswordResetVerificationResult)
  @UseGuards(GqlThrottlerGuard)
  async verifyPasswordResetCode(
    @Args('code') code: string,
  ): Promise<PasswordResetVerificationResult> {
    const email = await this.authService.verifyPasswordResetCode(code);
    return {
      email,
      isValid: true,
    };
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlThrottlerGuard)
  async resetPassword(
    @Args('input', { type: () => ResetPasswordInput }, PasswordValidationPipe)
    input: ResetPasswordInput,
  ): Promise<boolean> {
    await this.authService.resetPassword(input.email, input.newPassword);
    return true;
  }

  @Mutation(() => Boolean)
  @UseGuards(AuthGuard)
  async changePassword(
    @CurrentUser() user: User,
    @Args('input', { type: () => ChangePasswordInput }, PasswordValidationPipe) 
    input: ChangePasswordInput,
  ): Promise<boolean> {
    await this.authService.changePassword(
      user,
      input.currentPassword,
      input.newPassword,
    );
    return true;
  }

  @Mutation(() => Boolean)
  @UseGuards(AuthGuard)
  async sendEmailVerification(
    @CurrentUser() user: User,
  ): Promise<boolean> {
    await this.authService.sendEmailVerification(user);
    return true;
  }

  @Mutation(() => Boolean)
  @UseGuards(AuthGuard)
  async verifyEmail(
    @CurrentUser() user: User,
  ): Promise<boolean> {
    await this.authService.verifyEmail(user.firebaseUid);
    return true;
  }

  @Mutation(() => Boolean)
  @UseGuards(AuthGuard)
  async checkEmailVerified(
    @CurrentUser() user: User,
  ): Promise<boolean> {
    return this.authService.isEmailVerified(user.firebaseUid);
  }

  @Mutation(() => LoginResponse)
  @UseGuards(GqlThrottlerGuard)
  @Public()
  async login(@Args('input') input: LoginInput): Promise<LoginResponse> {
    const user = await this.authService.validateFirebaseUser(input.firebaseUid);
    
    return { user };
  }

  @Mutation(() => Boolean)
  @UseGuards(AuthGuard)
  async logout(@CurrentUser() user: User): Promise<boolean> {
    await this.authService.revokeUserSessions(user.firebaseUid);
    return true;
  }
}