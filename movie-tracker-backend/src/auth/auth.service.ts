// src/auth/auth.service.ts
import { 
  Injectable, 
  UnauthorizedException, 
  InternalServerErrorException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { UsersService } from '../modules/users/users.service';
import { User } from '../modules/users/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class AuthService {
  private readonly tokenBlacklist: Set<string> = new Set();

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async validateFirebaseUser(firebaseUid: string): Promise<User> {
    try {
      let user = await this.usersService.findByFirebaseUid(firebaseUid);
      
      if (!user) {
        const firebaseUser = await this.firebaseService.getUser(firebaseUid);
        if (!firebaseUser.email) {
          throw new BadRequestException('Firebase user email is required');
        }

        user = await this.usersService.createFirebaseUser({
          firebaseUid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email.split('@')[0],
        });
      }

      return user;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Error validating user');
    }
  }

  async initiatePasswordReset(email: string): Promise<void> {
    try {
      const actionCodeSettings = {
        url: this.configService.get('FRONTEND_URL') + '/auth/reset-password',
        handleCodeInApp: true,
      };

      // Generate password reset link
      const resetLink = await this.firebaseService.auth.generatePasswordResetLink(
        email,
        actionCodeSettings
      );

      // Here you might want to send this link via email
      // await this.emailService.sendPasswordResetEmail(email, resetLink);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // Don't reveal if user exists for security
        return;
      }
      throw new InternalServerErrorException('Failed to initiate password reset');
    }
  }

  async verifyPasswordResetCode(code: string): Promise<string> {
    try {
      // Get the email associated with the code
      const userInfo = await this.firebaseService.auth.getUser(code);
      return userInfo.email || '';
    } catch (error) {
      throw new BadRequestException('Invalid or expired reset code');
    }
  }

  async resetPassword(email: string, newPassword: string): Promise<void> {
    try {
      // Get the user by email
      const userRecord = await this.firebaseService.auth.getUserByEmail(email);
      
      // Update the password
      await this.firebaseService.auth.updateUser(userRecord.uid, {
        password: newPassword
      });

      // Revoke all refresh tokens
      await this.firebaseService.auth.revokeRefreshTokens(userRecord.uid);
    } catch (error) {
      throw new BadRequestException('Failed to reset password');
    }
  }

  async verifyEmail(uid: string): Promise<void> {
    try {
      await this.firebaseService.auth.updateUser(uid, {
        emailVerified: true
      });
    } catch (error) {
      throw new BadRequestException('Failed to verify email');
    }
  }

  async sendEmailVerification(user: User): Promise<void> {
    try {
      if (user.emailVerified) {
        throw new ConflictException('Email is already verified');
      }

      const actionCodeSettings = {
        url: this.configService.get('FRONTEND_URL') + '/auth/verify-email',
        handleCodeInApp: true,
      };

      const verificationLink = await this.firebaseService.auth.generateEmailVerificationLink(
        user.email,
        actionCodeSettings
      );

      // Here you might want to send this link via email
      // await this.emailService.sendVerificationEmail(user.email, verificationLink);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to send verification email');
    }
  }

  async getUserFromToken(token: string): Promise<User> {
    try {
      if (this.tokenBlacklist.has(token)) {
        throw new UnauthorizedException('Token has been revoked');
      }

      const cachedUser = await this.cacheManager.get(`token:${token}`);
      if (cachedUser) {
        return cachedUser as User;
      }

      const decodedToken = await this.firebaseService.auth.verifyIdToken(token);
      
      if (decodedToken.exp * 1000 < Date.now()) {
        throw new UnauthorizedException('Token has expired');
      }

      const user = await this.validateFirebaseUser(decodedToken.uid);
      
      await this.cacheManager.set(
        `token:${token}`,
        user,
        this.configService.get('TOKEN_CACHE_TTL', 300000)
      );

      return user;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException('Error processing authentication');
    }
  }

  async revokeUserSessions(firebaseUid: string): Promise<void> {
    try {
      await this.firebaseService.auth.revokeRefreshTokens(firebaseUid);
    } catch (error) {
      throw new InternalServerErrorException('Failed to revoke user sessions');
    }
  }

  async changePassword(
    user: User,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    try {
      const userRecord = await this.firebaseService.auth.getUser(user.firebaseUid);
      
      // Update the password
      await this.firebaseService.auth.updateUser(userRecord.uid, {
        password: newPassword
      });

      // Revoke all sessions to force re-login with new password
      await this.revokeUserSessions(userRecord.uid);
    } catch (error) {
      throw new UnauthorizedException('Failed to change password');
    }
  }
}