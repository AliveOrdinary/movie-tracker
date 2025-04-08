// src/modules/social/services/user-block.service.ts
import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserBlock } from '../entities/user-block.entity';
import { User } from '../../users/entities/user.entity';
import { CacheService } from '../../../common/services/cache.service';
import { FriendRequestService } from './friend-request.service';

@Injectable()
export class UserBlockService {
  constructor(
    @InjectRepository(UserBlock)
    private userBlockRepository: Repository<UserBlock>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly cacheService: CacheService,
    private readonly eventEmitter: EventEmitter2,
    private readonly friendRequestService: FriendRequestService,
  ) {}

  async blockUser(blockerId: string, blockedId: string, reason?: string): Promise<UserBlock> {
    // Check users exist
    const [blocker, blocked] = await Promise.all([
      this.userRepository.findOne({ where: { id: blockerId } }),
      this.userRepository.findOne({ where: { id: blockedId } })
    ]);

    if (!blocker || !blocked) {
      throw new NotFoundException('User not found');
    }

    // Can't block self
    if (blockerId === blockedId) {
      throw new ConflictException('Cannot block yourself');
    }

    // Check if already blocked
    const existingBlock = await this.userBlockRepository.findOne({
      where: { blocker_id: blockerId, blocked_id: blockedId }
    });

    if (existingBlock) {
      throw new ConflictException('User is already blocked');
    }

    // Check if they are friends and remove friendship if they are
    const areFriends = await this.friendRequestService.checkAreFriends(blockerId, blockedId);
    if (areFriends) {
      await this.friendRequestService.removeFriend(blockerId, blockedId);
    }

    // Create block
    const block = this.userBlockRepository.create({
      blocker_id: blockerId,
      blocked_id: blockedId,
      reason,
      blocker,
      blocked
    });

    const savedBlock = await this.userBlockRepository.save(block);

    // Emit event
    this.eventEmitter.emit('user.blocked', {
      blockId: savedBlock.id,
      blockerId,
      blockedId
    });

    // Invalidate cache
    await this.invalidateBlockCache(blockerId, blockedId);

    return savedBlock;
  }

  async unblockUser(blockerId: string, blockedId: string): Promise<boolean> {
    const block = await this.userBlockRepository.findOne({
      where: { blocker_id: blockerId, blocked_id: blockedId }
    });

    if (!block) {
      throw new NotFoundException('Block not found');
    }

    await this.userBlockRepository.remove(block);

    // Emit event
    this.eventEmitter.emit('user.unblocked', {
      blockerId,
      blockedId
    });

    // Invalidate cache
    await this.invalidateBlockCache(blockerId, blockedId);

    return true;
  }

  async getBlockedUsers(userId: string, page = 1, limit = 20): Promise<[UserBlock[], number]> {
    const cacheKey = `user:${userId}:blocked:${page}:${limit}`;
    
    return this.cacheService.getOrFetch(
      cacheKey,
      () => this.userBlockRepository.findAndCount({
        where: { blocker_id: userId },
        relations: ['blocked'],
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit
      }),
      3600 // 1 hour cache
    );
  }

  async getBlockedUsersCount(userId: string): Promise<number> {
    const cacheKey = `user:${userId}:blocked:count`;
    
    return this.cacheService.getOrFetch(
      cacheKey,
      () => this.userBlockRepository.count({ where: { blocker_id: userId } }),
      3600 // 1 hour cache
    );
  }

  async isUserBlocked(userId1: string, userId2: string): Promise<boolean> {
    const cacheKey = `block:${userId1}:${userId2}`;
    
    return this.cacheService.getOrFetch(
      cacheKey,
      async () => {
        // Check if either user has blocked the other
        const count = await this.userBlockRepository
          .createQueryBuilder('ub')
          .where(
            '(ub.blocker_id = :userId1 AND ub.blocked_id = :userId2) OR ' +
            '(ub.blocker_id = :userId2 AND ub.blocked_id = :userId1)',
            { userId1, userId2 }
          )
          .getCount();
        
        return count > 0;
      },
      3600 // 1 hour cache
    );
  }

  async isBlockedBy(blockedId: string, blockerId: string): Promise<boolean> {
    const cacheKey = `block:by:${blockerId}:${blockedId}`;
    
    return this.cacheService.getOrFetch(
      cacheKey,
      () => this.userBlockRepository
        .createQueryBuilder('ub')
        .where('ub.blocker_id = :blockerId AND ub.blocked_id = :blockedId', { blockerId, blockedId })
        .getExists(),
      3600 // 1 hour cache
    );
  }

  // Helper methods
  private async invalidateBlockCache(userId1: string, userId2: string): Promise<void> {
    await Promise.all([
      this.cacheService.invalidatePattern(`user:${userId1}:blocked:*`),
      this.cacheService.invalidate(`block:${userId1}:${userId2}`),
      this.cacheService.invalidate(`block:${userId2}:${userId1}`),
      this.cacheService.invalidate(`block:by:${userId1}:${userId2}`),
      this.cacheService.invalidate(`block:by:${userId2}:${userId1}`)
    ]);
  }
}
