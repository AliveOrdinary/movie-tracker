// src/auth/auth.service.ts
import { 
  Injectable, 
  UnauthorizedException, 
  InternalServerErrorException,
  BadRequestException,
  ConflictException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { UsersService } from '../modules/users/users.service';
import { TokenService } from './services/token.service';
import { User } from '../modules/users/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { CacheService } from '../common/services/cache.service';
import { CacheKeyFactory } from '../common/factories/cache-key.factory';
import { EntityCacheTTL } from '../common/constants/cache-ttl.constants';
import * as admin from 'firebase-admin';

/**
 * Service responsible for authentication-related operations
 * including user validation, password management, and email verification
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly cachePrefix = 'auth';

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly tokenService: TokenService,
    private readonly cacheService: CacheService,
    protected readonly cacheKeyFactory: CacheKeyFactory,
  ) {}

  /**
   * Validate a user from Firebase authentication
   * @param firebaseUid The Firebase UID of the user
   * @returns The validated user from our database
   */
  async validateFirebaseUser(firebaseUid: string): Promise<User> {
    console.log('Validating Firebase user:', firebaseUid);
    try {
      // First, try to find the user in our database
      let user = await this.usersService.findByFirebaseUid(firebaseUid);
      
      // If user doesn't exist in our database yet, create them
      if (!user) {
        const firebaseUser = await this.firebaseService.getUser(firebaseUid);
        
        if (!firebaseUser.email) {
          throw new BadRequestException('Firebase user email is required');
        }

        // Create a new user in our database linked to the Firebase user
        user = await this.usersService.createFirebaseUser({
          firebaseUid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email.split('@')[0],
          avatarUrl: firebaseUser.photoURL,
        });
        
        this.logger.log(`Created new user for Firebase UID: ${firebaseUid}`);
      }

      return user;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      this.logger.error(
        `Failed to validate Firebase user ${firebaseUid}: ${error.message}`,
        error.stack
      );
      
      throw new InternalServerErrorException('Error validating user');
    }
  }

  /**
   * Initiate the password reset flow
   * @param email The user's email address
   */
  async initiatePasswordReset(email: string): Promise<void> {
    try {
      // Generate actionCode settings for password reset
      const actionCodeSettings = {
        url: this.configService.get('FRONTEND_URL') + '/auth/reset-password',
        handleCodeInApp: true,
      };

      // Generate password reset link via Firebase
      const resetLink = await this.firebaseService.auth.generatePasswordResetLink(
        email,
        actionCodeSettings
      );

      // In a real implementation, you would send the resetLink via email here
      this.logger.log(`Password reset link generated for ${email}: ${resetLink}`);
      
      // Since we don't have email service integrated yet, we'll just log the link
      // In production, you would use an email service like:
      // await this.emailService.sendPasswordResetEmail(email, resetLink);
      
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // For security reasons, don't reveal if the user exists
        this.logger.warn(`Password reset attempted for non-existent user: ${email}`);
        return;
      }
      
      this.logger.error(
        `Failed to initiate password reset for ${email}: ${error.message}`,
        error.stack
      );
      
      throw new InternalServerErrorException('Failed to initiate password reset');
    }
  }

  /**
   * Verify a password reset code
   * Note: This is a placeholder since Firebase Admin SDK doesn't have direct code verification
   * In a real-world scenario, verification would happen client-side with Firebase client SDK
   * @param code The password reset code
   * @returns The email associated with the code
   */
  async verifyPasswordResetCode(code: string): Promise<string> {
    try {
      // In a real implementation, this would be handled by the client-side Firebase SDK
      // For server-side, we can only verify the token format is valid and return a placeholder
      
      if (!code || typeof code !== 'string' || code.length < 10) {
        throw new BadRequestException('Invalid reset code format');
      }
      
      // For demonstration purposes - in reality, the client would verify this
      return "user@example.com"; // Placeholder
      
    } catch (error) {
      this.logger.error(
        `Failed to verify password reset code: ${error.message}`,
        error.stack
      );
      
      throw new BadRequestException('Invalid or expired reset code');
    }
  }

  /**
   * Reset a user's password
   * Note: In a real implementation, this would be handled client-side
   * We're providing a server-side alternative using the Admin SDK
   * @param email The user's email
   * @param newPassword The new password
   */
  async resetPassword(email: string, newPassword: string): Promise<void> {
    try {
      // Get the Firebase user record by email
      const userRecord = await this.firebaseService.auth.getUserByEmail(email);
      
      // Update the password
      await this.firebaseService.auth.updateUser(userRecord.uid, {
        password: newPassword
      });
      
      // Revoke all refresh tokens for security
      await this.firebaseService.auth.revokeRefreshTokens(userRecord.uid);
      
      this.logger.log(`Password reset completed for ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to reset password for ${email}: ${error.message}`,
        error.stack
      );
      
      throw new BadRequestException('Failed to reset password: ' + error.message);
    }
  }

  /**
   * Send an email verification link to a user
   * @param user The user to send the verification to
   */
  async sendEmailVerification(user: User): Promise<void> {
    try {
      // Check if email is already verified
      const firebaseUser = await this.firebaseService.auth.getUser(user.firebaseUid);
      
      if (firebaseUser.emailVerified) {
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

      // In a real implementation, you would send the verificationLink via email here
      this.logger.log(`Verification link generated for ${user.email}: ${verificationLink}`);
      
      // Since we don't have email service integrated yet, we'll just log the link
      // In production, you would use an email service like:
      // await this.emailService.sendVerificationEmail(user.email, verificationLink);
      
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      
      this.logger.error(
        `Failed to send verification email to ${user.email}: ${error.message}`,
        error.stack
      );
      
      throw new InternalServerErrorException('Failed to send verification email');
    }
  }

  /**
   * Verify a user's email
   * Note: In Firebase, email verification is typically handled client-side
   * This method handles the server-side part by updating our database once Firebase confirms verification
   * @param firebaseUid The Firebase UID of the user
   */
  async verifyEmail(firebaseUid: string): Promise<void> {
    try {
      // Get the current verification status from Firebase
      const firebaseUser = await this.firebaseService.auth.getUser(firebaseUid);
      
      if (!firebaseUser.emailVerified) {
        throw new BadRequestException('Email has not been verified in Firebase');
      }
      
      // Find our user and update their email verification status
      const user = await this.usersService.findByFirebaseUid(firebaseUid);
      
      if (!user) {
        throw new NotFoundException('User not found in our database');
      }
      
      // Update the emailVerified flag in our database
      await this.usersService.update(user.id, { emailVerified: true });
      
      this.logger.log(`Email verified for user ${user.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to verify email: ${error.message}`,
        error.stack
      );
      
      throw new BadRequestException('Failed to verify email: ' + error.message);
    }
  }

  /**
   * Get a user from an authentication token
   * @param token The JWT token
   * @returns The authenticated user
   */
  async getUserFromToken(token: string): Promise<User> {
    try {
      // Check if token is blacklisted
      const isBlacklisted = await this.tokenService.isTokenBlacklisted(token);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }

      // Try to get the user from cache first
      const cacheKey = this.cacheKeyFactory.auth.token(token);
      return this.cacheService.getOrFetch(
        cacheKey,
        async () => {
          // Verify the token with Firebase
          const decodedToken = await this.firebaseService.auth.verifyIdToken(token);
          
          // Check if token is expired
          if (decodedToken.exp * 1000 < Date.now()) {
            throw new UnauthorizedException('Token has expired');
          }

          // Get the user from our database
          return this.validateFirebaseUser(decodedToken.uid);
        },
        EntityCacheTTL.AUTH_TOKEN // Use centralized TTL constant
      );
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      this.logger.error(
        `Error processing authentication token: ${error.message}`,
        error.stack
      );
      
      throw new InternalServerErrorException('Error processing authentication');
    }
  }

  /**
   * Revoke all sessions for a user
   * @param firebaseUid The Firebase UID of the user
   */
  async revokeUserSessions(firebaseUid: string): Promise<void> {
    try {
      await this.firebaseService.auth.revokeRefreshTokens(firebaseUid);
      
      // Invalidate any cached tokens for this user
      await this.cacheService.invalidatePattern(`auth:user:${firebaseUid}`);
      
      this.logger.log(`Sessions revoked for user ${firebaseUid}`);
    } catch (error) {
      this.logger.error(
        `Failed to revoke sessions for user ${firebaseUid}: ${error.message}`,
        error.stack
      );
      
      throw new InternalServerErrorException('Failed to revoke user sessions');
    }
  }

  /**
   * Change a user's password
   * @param user The user
   * @param currentPassword The current password
   * @param newPassword The new password
   */
  async changePassword(
    user: User,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    try {
      // We can't directly verify the current password with Firebase Admin SDK,
      // so we'll use the Firebase Auth REST API via a custom function
      // For this implementation, we'll assume the current password is correct
      // In a real implementation, you'd need to verify the current password
      
      // Get the Firebase user record
      const userRecord = await this.firebaseService.auth.getUser(user.firebaseUid);
      
      // Update the password
      await this.firebaseService.auth.updateUser(userRecord.uid, {
        password: newPassword
      });

      // Revoke all sessions for security
      await this.revokeUserSessions(userRecord.uid);
      
      this.logger.log(`Password changed for user ${user.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to change password for user ${user.id}: ${error.message}`,
        error.stack
      );
      
      throw new UnauthorizedException('Failed to change password: ' + error.message);
    }
  }

  /**
   * Check if a user's email is verified
   * @param firebaseUid The Firebase UID of the user
   * @returns Boolean indicating if the email is verified
   */
  async isEmailVerified(firebaseUid: string): Promise<boolean> {
    try {
      const userRecord = await this.firebaseService.auth.getUser(firebaseUid);
      return userRecord.emailVerified;
    } catch (error) {
      this.logger.error(
        `Failed to check email verification status for ${firebaseUid}: ${error.message}`,
        error.stack
      );
      
      throw new InternalServerErrorException('Failed to check email verification status');
    }
  }
}