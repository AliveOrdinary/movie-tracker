// src/auth/services/token.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class TokenService {
  private readonly TOKEN_BLACKLIST_PREFIX = 'token:blacklist:';
  private readonly REFRESH_TOKEN_PREFIX = 'refresh:';

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {}

  async blacklistToken(token: string, expiration: number): Promise<void> {
    await this.cacheManager.set(
      `${this.TOKEN_BLACKLIST_PREFIX}${token}`,
      'true',
      expiration * 1000 // Convert to milliseconds
    );
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const result = await this.cacheManager.get(`${this.TOKEN_BLACKLIST_PREFIX}${token}`);
    return !!result;
  }

  async storeRefreshToken(userId: string, token: string, expiration: number): Promise<void> {
    await this.cacheManager.set(
      `${this.REFRESH_TOKEN_PREFIX}${userId}`,
      token,
      expiration * 1000 // Convert to milliseconds
    );
  }

  async getRefreshToken(userId: string): Promise<string | null> {
    return this.cacheManager.get(`${this.REFRESH_TOKEN_PREFIX}${userId}`);
  }

  async revokeRefreshToken(userId: string): Promise<void> {
    await this.cacheManager.del(`${this.REFRESH_TOKEN_PREFIX}${userId}`);
  }
}