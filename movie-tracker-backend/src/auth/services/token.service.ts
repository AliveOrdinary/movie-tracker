// src/auth/services/token.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../../common/services/cache.service';
import { CacheKeyFactory } from '../../common/factories/cache-key.factory';
import { CacheTTL, EntityCacheTTL } from '../../common/constants/cache-ttl.constants';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);
  private readonly TOKEN_BLACKLIST_PREFIX = 'token:blacklist:';
  private readonly REFRESH_TOKEN_PREFIX = 'refresh:';

  constructor(
    private readonly cacheService: CacheService,
    private readonly configService: ConfigService,
    protected readonly cacheKeyFactory: CacheKeyFactory,
  ) {}

  /**
   * Add a token to the blacklist to prevent its reuse
   * @param token The JWT token to blacklist
   * @param expiration Time in seconds until the token expires
   */
  async blacklistToken(token: string, expiration: number): Promise<void> {
    try {
      await this.cacheService.set(
        this.cacheKeyFactory.auth.blacklist(token),
        true,
        expiration
      );
      this.logger.debug(`Token added to blacklist, expires in ${expiration}s`);
    } catch (error) {
      this.logger.error(`Failed to blacklist token: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Check if a token has been blacklisted
   * @param token The JWT token to check
   * @returns Boolean indicating if the token is blacklisted
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      const result = await this.cacheService.get<boolean>(this.cacheKeyFactory.auth.blacklist(token));
      return result === true;
    } catch (error) {
      this.logger.error(`Error checking token blacklist: ${error.message}`, error.stack);
      // Default to treating token as valid if we can't check blacklist
      // This is conservative but prevents legitimate users from being locked out
      // if the cache service is down
      return false;
    }
  }

  /**
   * Store a refresh token for a user
   * @param userId The user's ID
   * @param token The refresh token
   * @param expiration Time in seconds until the token expires
   */
  async storeRefreshToken(userId: string, token: string, expiration: number): Promise<void> {
    try {
      await this.cacheService.set(
        this.cacheKeyFactory.auth.refreshToken(userId),
        token,
        expiration
      );
      this.logger.debug(`Refresh token stored for user ${userId}, expires in ${expiration}s`);
    } catch (error) {
      this.logger.error(`Failed to store refresh token: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get a user's refresh token
   * @param userId The user's ID
   * @returns The refresh token or null if not found
   */
  async getRefreshToken(userId: string): Promise<string | null> {
    try {
      return this.cacheService.get<string>(this.cacheKeyFactory.auth.refreshToken(userId));
    } catch (error) {
      this.logger.error(`Failed to get refresh token: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Revoke a user's refresh token
   * @param userId The user's ID
   */
  async revokeRefreshToken(userId: string): Promise<void> {
    try {
      await this.cacheService.invalidate(this.cacheKeyFactory.auth.refreshToken(userId));
      this.logger.debug(`Refresh token revoked for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to revoke refresh token: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Revoke all tokens for a user (useful when changing password, etc.)
   * @param userId The user's ID
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    try {
      // Revoke refresh token
      await this.revokeRefreshToken(userId);
      
      // Additionally, attempt to invalidate any access tokens via pattern
      // This requires Redis to be enabled, otherwise it's a no-op
      await this.cacheService.invalidatePattern(`auth:user:${userId}`);
      
      this.logger.debug(`All tokens revoked for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to revoke all user tokens: ${error.message}`, error.stack);
      throw error;
    }
  }
}