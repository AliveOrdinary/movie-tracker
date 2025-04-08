// src/modules/social/services/friend-request.service.ts
import { Injectable, NotFoundException, ForbiddenException, ConflictException, Logger, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FriendRequest } from '../entities/friend-request.entity';
import { User } from '../../users/entities/user.entity';
import { CacheService } from '../../../common/services/cache.service';
import { CacheKeyFactory } from '../../../common/factories/cache-key.factory';
import { EntityCacheTTL } from '../../../common/constants/cache-ttl.constants';
import { FriendRequestStatus } from '../../../common/enums';
import { ActivityType } from '../entities/activity.entity';
import { SocialService } from '../social.service';

@Injectable()
export class FriendRequestService {
  private readonly logger = new Logger(FriendRequestService.name);

  constructor(
    @InjectRepository(FriendRequest)
    private friendRequestRepository: Repository<FriendRequest>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly cacheService: CacheService,
    protected readonly cacheKeyFactory: CacheKeyFactory,
    private readonly eventEmitter: EventEmitter2,
    private readonly socialService: SocialService,
  ) {}

  async sendFriendRequest(senderId: string, receiverId: string): Promise<FriendRequest> {
    try {
      // Check users exist
      const [sender, receiver] = await Promise.all([
        this.userRepository.findOne({ where: { id: senderId } }),
        this.userRepository.findOne({ where: { id: receiverId } })
      ]);

      if (!sender || !receiver) {
        throw new NotFoundException('User not found');
      }

      // Can't send request to self
      if (senderId === receiverId) {
        throw new ConflictException('Cannot send friend request to yourself');
      }

      // Check if already friends
      const alreadyFriends = await this.checkAreFriends(senderId, receiverId);
      if (alreadyFriends) {
        throw new ConflictException('Already friends with this user');
      }

      // Check if request already exists
      const existingRequest = await this.friendRequestRepository
        .createQueryBuilder('fr')
        .where(
          '(fr.sender_id = :senderId AND fr.recipient_id = :receiverId) OR ' +
          '(fr.sender_id = :receiverId AND fr.recipient_id = :senderId)',
          { senderId, receiverId }
        )
        .getOne();

      if (existingRequest) {
        if (existingRequest.sender_id === senderId) {
          throw new ConflictException('Friend request already sent');
        } else {
          // The other user already sent a request, so accept it
          return this.updateFriendRequestStatus(existingRequest.id, senderId, FriendRequestStatus.ACCEPTED);
        }
      }

      // Create request
      const request = this.friendRequestRepository.create({
        sender: { id: senderId },
        recipient: { id: receiverId },
        status: FriendRequestStatus.PENDING
      });

      const savedRequest = await this.friendRequestRepository.save(request);

      // Emit event for notification
      this.eventEmitter.emit('friend-request.sent', {
        requestId: savedRequest.id,
        senderId,
        receiverId
      });

      // Invalidate cache
      await this.invalidateFriendCache(senderId, receiverId);

      return savedRequest;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      
      this.logger.error(`Error sending friend request from ${senderId} to ${receiverId}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to send friend request');
    }
  }

  async updateFriendRequestStatus(requestId: string, userId: string, status: FriendRequestStatus): Promise<FriendRequest> {
    try {
      const request = await this.friendRequestRepository.findOne({
        where: { id: requestId },
        relations: ['sender', 'receiver']
      });

      if (!request) {
        throw new NotFoundException('Friend request not found');
      }

      // Only receiver can accept/reject
      if (request.recipient_id !== userId) {
        throw new ForbiddenException('You cannot modify this friend request');
      }

      // Already processed
      if (request.status !== FriendRequestStatus.PENDING) {
        throw new ConflictException('This request has already been processed');
      }

      request.status = status;
      const updatedRequest = await this.friendRequestRepository.save(request);

      // If accepted, create activity for both users becoming friends
      if (status === FriendRequestStatus.ACCEPTED) {
        // Create activity for both users
        await Promise.all([
          this.socialService.createActivity({
            userId: request.sender_id,
            type: ActivityType.BECAME_FRIENDS,
            targetUserId: request.recipient_id
          }),
          this.socialService.createActivity({
            userId: request.recipient_id,
            type: ActivityType.BECAME_FRIENDS,
            targetUserId: request.sender_id
          })
        ]);

        // Emit event
        this.eventEmitter.emit('friend-request.accepted', {
          requestId: updatedRequest.id,
          senderId: request.sender_id,
          receiverId: request.recipient_id
        });
      } else {
        // Emit rejected event
        this.eventEmitter.emit('friend-request.rejected', {
          requestId: updatedRequest.id,
          senderId: request.sender_id,
          receiverId: request.recipient_id
        });
      }

      // Invalidate cache
      await this.invalidateFriendCache(request.sender_id, request.recipient_id);

      return updatedRequest;
    } catch (error) {
      if (error instanceof NotFoundException || 
          error instanceof ForbiddenException || 
          error instanceof ConflictException) {
        throw error;
      }
      
      this.logger.error(`Error updating friend request ${requestId} status: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to update friend request status');
    }
  }

  async cancelFriendRequest(requestId: string, userId: string): Promise<boolean> {
    try {
      const request = await this.friendRequestRepository.findOne({
        where: { id: requestId }
      });

      if (!request) {
        throw new NotFoundException('Friend request not found');
      }

      // Only sender can cancel
      if (request.sender_id !== userId) {
        throw new ForbiddenException('You cannot cancel this friend request');
      }

      // Already processed
      if (request.status !== FriendRequestStatus.PENDING) {
        throw new ConflictException('This request has already been processed');
      }

      const senderId = request.sender_id;
      const recipientId = request.recipient_id;

      await this.friendRequestRepository.remove(request);

      // Emit event
      this.eventEmitter.emit('friend-request.canceled', {
        requestId,
        senderId,
        recipientId
      });

      // Invalidate cache
      await this.invalidateFriendCache(senderId, recipientId);

      return true;
    } catch (error) {
      if (error instanceof NotFoundException || 
          error instanceof ForbiddenException || 
          error instanceof ConflictException) {
        throw error;
      }
      
      this.logger.error(`Error canceling friend request ${requestId}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to cancel friend request');
    }
  }

  async removeFriend(userId: string, friendId: string): Promise<boolean> {
    try {
      // Find the accepted friend request
      const request = await this.friendRequestRepository
        .createQueryBuilder('fr')
        .where(
          '((fr.sender_id = :userId AND fr.recipient_id = :friendId) OR ' +
          '(fr.sender_id = :friendId AND fr.recipient_id = :userId)) ' +
          'AND fr.status = :status',
          { userId, friendId, status: FriendRequestStatus.ACCEPTED }
        )
        .getOne();

      if (!request) {
        throw new NotFoundException('Friend relationship not found');
      }

      await this.friendRequestRepository.remove(request);

      // Emit event
      this.eventEmitter.emit('friend.removed', {
        userId,
        friendId
      });

      // Invalidate cache
      await this.invalidateFriendCache(userId, friendId);

      return true;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.error(`Error removing friend relationship between ${userId} and ${friendId}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to remove friend');
    }
  }

  async getReceivedFriendRequests(userId: string, page = 1, limit = 20): Promise<[FriendRequest[], number]> {
    try {
      const cacheKey = this.cacheKeyFactory.generate('friend', 'received', [userId, page, limit]);
      
      return this.cacheService.getOrFetch(
        cacheKey,
        () => this.friendRequestRepository.findAndCount({
          where: { 
            recipient_id: userId,
            status: FriendRequestStatus.PENDING
          },
          relations: ['sender'],
          order: { createdAt: 'DESC' },
          skip: (page - 1) * limit,
          take: limit
        }),
        EntityCacheTTL.SHORT
      );
    } catch (error) {
      this.logger.error(`Error getting received friend requests for user ${userId}: ${error.message}`, error.stack);
      return [[], 0];
    }
  }

  async getSentFriendRequests(userId: string, page = 1, limit = 20): Promise<[FriendRequest[], number]> {
    try {
      const cacheKey = this.cacheKeyFactory.generate('friend', 'sent', [userId, page, limit]);
      
      return this.cacheService.getOrFetch(
        cacheKey,
        () => this.friendRequestRepository.findAndCount({
          where: { 
            sender_id: userId,
            status: FriendRequestStatus.PENDING
          },
          relations: ['recipient'],
          order: { createdAt: 'DESC' },
          skip: (page - 1) * limit,
          take: limit
        }),
        EntityCacheTTL.SHORT
      );
    } catch (error) {
      this.logger.error(`Error getting sent friend requests for user ${userId}: ${error.message}`, error.stack);
      return [[], 0];
    }
  }

  async getUserFriends(userId: string, page = 1, limit = 20): Promise<[User[], number]> {
    try {
      const cacheKey = this.cacheKeyFactory.generate('friend', 'list', [userId, page, limit]);
      
      return this.cacheService.getOrFetch(
        cacheKey,
        async () => {
          // Get accepted requests where user is either sender or receiver
          const query = this.friendRequestRepository
            .createQueryBuilder('fr')
            .where(
              '(fr.sender_id = :userId OR fr.recipient_id = :userId) ' +
              'AND fr.status = :status',
              { userId, status: FriendRequestStatus.ACCEPTED }
            )
            .leftJoinAndSelect('fr.sender', 'sender')
            .leftJoinAndSelect('fr.recipient', 'recipient')
            .orderBy('fr.updatedAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

          const [requests, total] = await query.getManyAndCount();

          // Map to array of friend users (either sender or receiver, depending on which is not the user)
          const friends = requests.map(req => 
            req.sender_id === userId ? req.recipient : req.sender
          );

          return [friends, total];
        },
        EntityCacheTTL.MEDIUM
      );
    } catch (error) {
      this.logger.error(`Error getting friends for user ${userId}: ${error.message}`, error.stack);
      return [[], 0];
    }
  }

  async getFriendsCount(userId: string): Promise<number> {
    try {
      const cacheKey = this.cacheKeyFactory.generate('friend', 'count', [userId]);
      
      return this.cacheService.getOrFetch(
        cacheKey,
        () => this.friendRequestRepository
          .createQueryBuilder('fr')
          .where(
            '(fr.sender_id = :userId OR fr.recipient_id = :userId) ' +
            'AND fr.status = :status',
            { userId, status: FriendRequestStatus.ACCEPTED }
          )
          .getCount(),
        EntityCacheTTL.MEDIUM
      );
    } catch (error) {
      this.logger.error(`Error getting friends count for user ${userId}: ${error.message}`, error.stack);
      return 0;
    }
  }

  async checkAreFriends(userId1: string, userId2: string): Promise<boolean> {
    try {
      const cacheKey = this.cacheKeyFactory.generate('friend', 'check', [userId1, userId2]);
      
      return this.cacheService.getOrFetch(
        cacheKey,
        async () => {
          const count = await this.friendRequestRepository
            .createQueryBuilder('fr')
            .where(
              '((fr.sender_id = :userId1 AND fr.recipient_id= :userId2) OR ' +
              '(fr.sender_id = :userId2 AND fr.recipient_id = :userId1)) ' +
              'AND fr.status = :status',
              { userId1, userId2, status: FriendRequestStatus.ACCEPTED }
            )
            .getCount();
          
          return count > 0;
        },
        EntityCacheTTL.MEDIUM
      );
    } catch (error) {
      this.logger.error(`Error checking friendship between ${userId1} and ${userId2}: ${error.message}`, error.stack);
      return false;
    }
  }

  async getFriendRequestStatus(userId1: string, userId2: string): Promise<FriendRequest | null> {
    try {
      const cacheKey = this.cacheKeyFactory.generate('friend', 'status', [userId1, userId2]);
      
      return this.cacheService.getOrFetch(
        cacheKey,
        () => this.friendRequestRepository
          .createQueryBuilder('fr')
          .where(
            '((fr.sender_id = :userId1 AND fr.recipient_id = :userId2) OR ' +
            '(fr.sender_id = :userId2 AND fr.recipient_id = :userId1))',
            { userId1, userId2 }
          )
          .getOne(),
        EntityCacheTTL.SHORT
      );
    } catch (error) {
      this.logger.error(`Error getting friend request status between ${userId1} and ${userId2}: ${error.message}`, error.stack);
      return null;
    }
  }

  // Helper methods
  private async invalidateFriendCache(userId1: string, userId2: string): Promise<void> {
    try {
      await Promise.all([
        // Invalidate requests lists
        this.cacheService.invalidatePattern(
          this.cacheKeyFactory.generate('friend', 'received', [userId1])
        ),
        this.cacheService.invalidatePattern(
          this.cacheKeyFactory.generate('friend', 'received', [userId2])
        ),
        this.cacheService.invalidatePattern(
          this.cacheKeyFactory.generate('friend', 'sent', [userId1])
        ),
        this.cacheService.invalidatePattern(
          this.cacheKeyFactory.generate('friend', 'sent', [userId2])
        ),
        
        // Invalidate friends lists
        this.cacheService.invalidatePattern(
          this.cacheKeyFactory.generate('friend', 'list', [userId1])
        ),
        this.cacheService.invalidatePattern(
          this.cacheKeyFactory.generate('friend', 'list', [userId2])
        ),
        
        // Invalidate counts
        this.cacheService.invalidate(
          this.cacheKeyFactory.generate('friend', 'count', [userId1])
        ),
        this.cacheService.invalidate(
          this.cacheKeyFactory.generate('friend', 'count', [userId2])
        ),
        
        // Invalidate relationship checks
        this.cacheService.invalidate(
          this.cacheKeyFactory.generate('friend', 'check', [userId1, userId2])
        ),
        this.cacheService.invalidate(
          this.cacheKeyFactory.generate('friend', 'check', [userId2, userId1])
        ),
        
        // Invalidate status
        this.cacheService.invalidate(
          this.cacheKeyFactory.generate('friend', 'status', [userId1, userId2])
        ),
        this.cacheService.invalidate(
          this.cacheKeyFactory.generate('friend', 'status', [userId2, userId1])
        )
      ]);
    } catch (error) {
      this.logger.error(`Error invalidating friend cache for users ${userId1} and ${userId2}: ${error.message}`, error.stack);
    }
  }
}