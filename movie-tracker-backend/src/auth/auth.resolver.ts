// src/auth/auth.resolver.ts
import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from '../modules/users/entities/user.entity';
import { FirebaseAuthGuard } from './guards/firebase-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { PasswordValidationPipe } from './pipes/password-validation.pipe';
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

  @Query(() => User)
  @UseGuards(FirebaseAuthGuard)
  async me(@CurrentUser() user: User): Promise<User> {
    return user;
  }

  @Mutation(() => Boolean)
  async initiatePasswordReset(
    @Args('input') input: InitiatePasswordResetInput,
  ): Promise<boolean> {
    await this.authService.initiatePasswordReset(input.email);
    return true;
  }

  @Mutation(() => PasswordResetVerificationResult)
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
  async resetPassword(
    @Args('input', { type: () => ResetPasswordInput }, PasswordValidationPipe)
    input: ResetPasswordInput,
  ): Promise<boolean> {
    await this.authService.resetPassword(input.email, input.newPassword);
    return true;
  }

  @Mutation(() => Boolean)
  @UseGuards(FirebaseAuthGuard)
  async changePassword(
    @CurrentUser() user: User,
    @Args('input') input: ChangePasswordInput,
  ): Promise<boolean> {
    await this.authService.changePassword(
      user,
      input.currentPassword,
      input.newPassword,
    );
    return true;
  }

  @Mutation(() => Boolean)
  @UseGuards(FirebaseAuthGuard)
  async sendEmailVerification(
    @CurrentUser() user: User,
  ): Promise<boolean> {
    await this.authService.sendEmailVerification(user);
    return true;
  }

  @Mutation(() => Boolean)
  @UseGuards(FirebaseAuthGuard)
  async verifyEmail(
    @CurrentUser() user: User,
  ): Promise<boolean> {
    await this.authService.verifyEmail(user.firebaseUid);
    return true;
  }

  @Mutation(() => LoginResponse)
  async login(@Args('input') input: LoginInput): Promise<LoginResponse> {
    const user = await this.authService.validateFirebaseUser(input.firebaseUid);
    return { user };
  }

  @Mutation(() => Boolean)
  @UseGuards(FirebaseAuthGuard)
  async logout(@CurrentUser() user: User): Promise<boolean> {
    await this.authService.revokeUserSessions(user.firebaseUid);
    return true;
  }
}