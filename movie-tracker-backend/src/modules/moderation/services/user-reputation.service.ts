// src/modules/moderation/services/user-reputation.service.ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan, LessThan } from 'typeorm';
import { UserReputation, ReputationLevel } from '../entities/user-reputation.entity';
import { User } from '../../users/entities/user.entity';
import { CacheService } from '../../../common/services/cache.service';
import { CacheKeyFactory } from '../../../common/factories/cache-key.factory';
import { CacheTTL } from '../../../common/constants/cache-ttl.constants';
import { UpdateUserReputationInput, ReputationAdjustmentInput } from '../dto/user-reputation.dto';

@Injectable()
export class UserReputationService {
  private readonly logger = new Logger(UserReputationService.name);

  constructor(
    @InjectRepository(UserReputation)
    private readonly userReputationRepository: Repository<UserReputation>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly cacheService: CacheService,
    protected readonly cacheKeyFactory: CacheKeyFactory,
  ) {}

  /**
   * Find user reputation by user ID
   */
  async findByUserId(userId: string): Promise<UserReputation> {
    const cacheKey = this.cacheKeyFactory.user.reputation(userId);
    
    return this.cacheService.getOrFetch(
      cacheKey,
      async () => {
        let reputation = await this.userReputationRepository.findOne({
          where: { userId },
          relations: ['user'],
        });

        if (!reputation) {
          // If no reputation record exists, create one with default values
          reputation = await this.createDefaultReputation(userId);
        }

        return reputation;
      },
      CacheTTL.MEDIUM
    );
  }

  /**
   * Find all user reputations by level
   */
  async findAllByLevel(level: ReputationLevel, page = 1, limit = 10): Promise<[UserReputation[], number]> {
    const cacheKey = this.cacheKeyFactory.user.reputationLevel(level);
    
    return this.cacheService.getOrFetch(
      cacheKey,
      async () => {
        return this.userReputationRepository.findAndCount({
          where: { level },
          relations: ['user'],
          skip: (page - 1) * limit,
          take: limit,
          order: { score: 'DESC' },
        });
      },
      CacheTTL.SHORT
    );
  }

  /**
   * Find all user reputations by score range
   */
  async findAllByScoreRange(minScore: number, maxScore: number, page = 1, limit = 10): Promise<[UserReputation[], number]> {
    const cacheKey = this.cacheKeyFactory.generate('user', 'reputationScoreRange', [minScore, maxScore, page, limit]);
    
    return this.cacheService.getOrFetch(
      cacheKey,
      async () => {
        return this.userReputationRepository.findAndCount({
          where: { score: Between(minScore, maxScore) },
          relations: ['user'],
          skip: (page - 1) * limit,
          take: limit,
          order: { score: 'DESC' },
        });
      },
      CacheTTL.SHORT
    );
  }

  /**
   * Create default reputation for a new user
   */
  private async createDefaultReputation(userId: string): Promise<UserReputation> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    
    const reputation = this.userReputationRepository.create({
      userId,
      user,
      score: 50, // Default starting score
      level: ReputationLevel.NEUTRAL,
      approvedContentCount: 0,
      rejectedContentCount: 0,
      validReportCount: 0,
      invalidReportCount: 0,
    });
    
    return this.userReputationRepository.save(reputation);
  }

  /**
   * Update user reputation
   */
  async updateReputation(input: UpdateUserReputationInput): Promise<UserReputation> {
    const { userId, reputationScore, reputationLevel, reason } = input;
    
    let reputation = await this.userReputationRepository.findOne({
      where: { userId },
    });
    
    if (!reputation) {
      reputation = await this.createDefaultReputation(userId);
    }
    
    // Update fields if provided
    if (reputationScore !== undefined) reputation.score = reputationScore;
    if (reputationLevel !== undefined) reputation.level = reputationLevel;
    if (reason) reputation.adminNotes = reason;
    
    // Save updated reputation
    const saved = await this.userReputationRepository.save(reputation);
    
    // Clear cache
    await this.invalidateUserReputationCache(userId);
    
    return saved;
  }

  /**
   * Adjust user reputation score
   */
  async adjustReputationScore(input: ReputationAdjustmentInput): Promise<UserReputation> {
    const { userId, adjustment, reason } = input;
    
    let reputation = await this.userReputationRepository.findOne({
      where: { userId },
    });
    
    if (!reputation) {
      reputation = await this.createDefaultReputation(userId);
    }
    
    // Apply adjustment
    reputation.score += adjustment;
    
    // Update level based on new score
    reputation.level = this.calculateReputationLevel(reputation.score);
    
    // Add reason to history
    if (!reputation.adjustmentHistory) {
      reputation.adjustmentHistory = [];
    }
    
    reputation.adjustmentHistory.push({
      date: new Date().toISOString(),
      adjustment,
      reason,
      newScore: reputation.score,
    });
    
    // Save updated reputation
    const saved = await this.userReputationRepository.save(reputation);
    
    // Clear cache
    await this.invalidateUserReputationCache(userId);
    
    return saved;
  }

  /**
   * Calculate reputation level based on score
   */
  private calculateReputationLevel(score: number): ReputationLevel {
    if (score >= 90) return ReputationLevel.TRUSTED;
    if (score >= 70) return ReputationLevel.GOOD;
    if (score >= 40) return ReputationLevel.NEUTRAL;
    if (score >= 20) return ReputationLevel.QUESTIONABLE;
    return ReputationLevel.UNTRUSTED;
  }

  /**
   * Increment approved content count
   */
  async incrementApprovedContent(userId: string): Promise<void> {
    try {
      let reputation = await this.userReputationRepository.findOne({
        where: { userId },
      });
      
      if (!reputation) {
        reputation = await this.createDefaultReputation(userId);
      }
      
      // Increment counter
      reputation.approvedContentCount += 1;
      
      // Adjust score
      reputation.score += 2;
      reputation.score = Math.min(reputation.score, 100); // Cap at 100
      
      // Update level
      reputation.level = this.calculateReputationLevel(reputation.score);
      
      // Save
      await this.userReputationRepository.save(reputation);
      
      // Clear cache
      await this.invalidateUserReputationCache(userId);
    } catch (error) {
      this.logger.error(`Error incrementing approved content for user ${userId}: ${error.message}`);
    }
  }

  async findOrCreateForUser(userId: string): Promise<UserReputation> {
    let reputation = await this.userReputationRepository.findOne({
      where: { userId }
    });
    
    if (!reputation) {
      reputation = await this.createDefaultReputation(userId);
    }
    
    return reputation;
  }

  /**
   * Increment rejected content count
   */
  async incrementRejectedContent(userId: string): Promise<void> {
    try {
      let reputation = await this.userReputationRepository.findOne({
        where: { userId },
      });
      
      if (!reputation) {
        reputation = await this.createDefaultReputation(userId);
      }
      
      // Increment counter
      reputation.rejectedContentCount += 1;
      
      // Adjust score
      reputation.score -= 5;
      reputation.score = Math.max(reputation.score, 0); // Ensure not negative
      
      // Update level
      reputation.level = this.calculateReputationLevel(reputation.score);
      
      // Save
      await this.userReputationRepository.save(reputation);
      
      // Clear cache
      await this.invalidateUserReputationCache(userId);
    } catch (error) {
      this.logger.error(`Error incrementing rejected content for user ${userId}: ${error.message}`);
    }
  }

  /**
   * Increment valid report count
   */
  async incrementValidReport(userId: string): Promise<void> {
    try {
      let reputation = await this.userReputationRepository.findOne({
        where: { userId },
      });
      
      if (!reputation) {
        reputation = await this.createDefaultReputation(userId);
      }
      
      // Increment counter
      reputation.validReportCount += 1;
      
      // Adjust score
      reputation.score += 1;
      reputation.score = Math.min(reputation.score, 100); // Cap at 100
      
      // Update level
      reputation.level = this.calculateReputationLevel(reputation.score);
      
      // Save
      await this.userReputationRepository.save(reputation);
      
      // Clear cache
      await this.invalidateUserReputationCache(userId);
    } catch (error) {
      this.logger.error(`Error incrementing valid report for user ${userId}: ${error.message}`);
    }
  }

  /**
   * Increment invalid report count
   */
  async incrementInvalidReport(userId: string): Promise<void> {
    try {
      let reputation = await this.userReputationRepository.findOne({
        where: { userId },
      });
      
      if (!reputation) {
        reputation = await this.createDefaultReputation(userId);
      }
      
      // Increment counter
      reputation.invalidReportCount += 1;
      
      // Adjust score
      reputation.score -= 2;
      reputation.score = Math.max(reputation.score, 0); // Ensure not negative
      
      // Update level
      reputation.level = this.calculateReputationLevel(reputation.score);
      
      // Save
      await this.userReputationRepository.save(reputation);
      
      // Clear cache
      await this.invalidateUserReputationCache(userId);
    } catch (error) {
      this.logger.error(`Error incrementing invalid report for user ${userId}: ${error.message}`);
    }
  }

  /**
   * Clear user reputation cache
   */
  private async invalidateUserReputationCache(userId: string): Promise<void> {
    try {
      // Clear user-specific reputation cache
      await this.cacheService.invalidate(this.cacheKeyFactory.user.reputation(userId));
      
      // Clear reputation level caches as the user's level might change
      for (const level of Object.values(ReputationLevel)) {
        await this.cacheService.invalidate(this.cacheKeyFactory.user.reputationLevel(level));
      }
      
      // Clear any score range caches
      await this.cacheService.invalidatePattern('user:reputationScoreRange:*');
      
      this.logger.log(`Invalidated reputation caches for user ${userId}`);
    } catch (error) {
      this.logger.error(`Error invalidating reputation caches: ${error.message}`);
    }
  }
}