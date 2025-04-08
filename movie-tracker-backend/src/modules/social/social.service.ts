// src/modules/social/social.service.ts
import { Injectable, ConflictException, NotFoundException, Logger, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserFollow } from './entities/user-follow.entity';
import { Activity, ActivityType } from './entities/activity.entity';
import { User } from '../users/entities/user.entity';
import { Movie } from '../movies/entities/movie.entity';
import { Review } from '../reviews/entities/review.entity';
import { List } from '../lists/entities/list.entity';
import { WatchHistory } from '../watch-history/entities/watch-history.entity';
import { ActivityFiltersInput } from './dto/activity-filters.input';
import { CacheService } from '../../common/services/cache.service';
import { CacheKeyFactory } from '../../common/factories/cache-key.factory';
import { EntityCacheTTL } from '../../common/constants/cache-ttl.constants';
import { ActivityFeedFilter } from '../../common/enums';

@Injectable()
export class SocialService {
  private readonly logger = new Logger(SocialService.name);

  constructor(
    @InjectRepository(UserFollow)
    private userFollowRepository: Repository<UserFollow>,
    @InjectRepository(Activity)
    private activityRepository: Repository<Activity>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly cacheService: CacheService,
    protected readonly cacheKeyFactory: CacheKeyFactory,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async followUser(followerId: string, followingId: string): Promise<UserFollow> {
    try {
      // Check if users exist
      const [follower, following] = await Promise.all([
        this.userRepository.findOne({ where: { id: followerId } }),
        this.userRepository.findOne({ where: { id: followingId } })
      ]);

      if (!follower || !following) {
        throw new NotFoundException('User not found');
      }

      // Check if already following
      const existingFollow = await this.userFollowRepository.findOne({
        where: { follower_id: followerId, following_id: followingId }
      });

      if (existingFollow) {
        throw new ConflictException('Already following this user');
      }

      // Create follow relationship
      const follow = this.userFollowRepository.create({
        follower_id: followerId,
        following_id: followingId,
        follower,
        following
      });

      const savedFollow = await this.userFollowRepository.save(follow);

      // Create activity
      await this.createActivity({
        userId: followerId,
        type: ActivityType.FOLLOWED_USER,
        targetUserId: followingId
      });

      // Invalidate cache for followers/following counts
      await this.invalidateFollowCache(followerId, followingId);

      return savedFollow;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      
      this.logger.error(`Error following user ${followingId} by ${followerId}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('An error occurred while following user');
    }
  }

  async unfollowUser(followerId: string, followingId: string): Promise<boolean> {
    try {
      const follow = await this.userFollowRepository.findOne({
        where: { follower_id: followerId, following_id: followingId }
      });

      if (!follow) {
        throw new NotFoundException('Follow relationship not found');
      }

      await this.userFollowRepository.remove(follow);

      // Invalidate cache for followers/following counts
      await this.invalidateFollowCache(followerId, followingId);

      return true;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.error(`Error unfollowing user ${followingId} by ${followerId}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('An error occurred while unfollowing user');
    }
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    try {
      const cacheKey = this.cacheKeyFactory.generate('social', 'isFollowing', [followerId, followingId]);
      
      return this.cacheService.getOrFetch(
        cacheKey,
        async () => {
          const follow = await this.userFollowRepository.findOne({
            where: { follower_id: followerId, following_id: followingId }
          });
          return !!follow;
        },
        EntityCacheTTL.MEDIUM
      );
    } catch (error) {
      this.logger.error(`Error checking follow status for ${followerId} following ${followingId}: ${error.message}`, error.stack);
      return false;
    }
  }

  async getFollowers(userId: string, page = 1, limit = 20): Promise<[User[], number]> {
    try {
      const cacheKey = this.cacheKeyFactory.generate('social', 'followers', [userId, page, limit]);
      
      return this.cacheService.getOrFetch(
        cacheKey,
        async () => {
          const [follows, total] = await this.userFollowRepository.findAndCount({
            where: { following_id: userId },
            relations: ['follower'],
            skip: (page - 1) * limit,
            take: limit,
            order: { createdAt: 'DESC' }
          });

          return [follows.map(follow => follow.follower), total];
        },
        EntityCacheTTL.SHORT
      );
    } catch (error) {
      this.logger.error(`Error getting followers for user ${userId}: ${error.message}`, error.stack);
      return [[], 0];
    }
  }

  async getFollowing(userId: string, page = 1, limit = 20): Promise<[User[], number]> {
    try {
      const cacheKey = this.cacheKeyFactory.generate('social', 'following', [userId, page, limit]);
      
      return this.cacheService.getOrFetch(
        cacheKey,
        async () => {
          const [follows, total] = await this.userFollowRepository.findAndCount({
            where: { follower_id: userId },
            relations: ['following'],
            skip: (page - 1) * limit,
            take: limit,
            order: { createdAt: 'DESC' }
          });

          return [follows.map(follow => follow.following), total];
        },
        EntityCacheTTL.SHORT
      );
    } catch (error) {
      this.logger.error(`Error getting following users for user ${userId}: ${error.message}`, error.stack);
      return [[], 0];
    }
  }

  async getFollowersCount(userId: string): Promise<number> {
    try {
      const cacheKey = this.cacheKeyFactory.generate('social', 'followersCount', [userId]);
      
      return this.cacheService.getOrFetch(
        cacheKey,
        () => this.userFollowRepository.count({ where: { following_id: userId } }),
        EntityCacheTTL.MEDIUM
      );
    } catch (error) {
      this.logger.error(`Error getting followers count for user ${userId}: ${error.message}`, error.stack);
      return 0;
    }
  }

  async getFollowingCount(userId: string): Promise<number> {
    try {
      const cacheKey = this.cacheKeyFactory.generate('social', 'followingCount', [userId]);
      
      return this.cacheService.getOrFetch(
        cacheKey,
        () => this.userFollowRepository.count({ where: { follower_id: userId } }),
        EntityCacheTTL.MEDIUM
      );
    } catch (error) {
      this.logger.error(`Error getting following count for user ${userId}: ${error.message}`, error.stack);
      return 0;
    }
  }

  // Activity methods
  async createActivity(data: {
    userId: string,
    type: ActivityType,
    movieId?: string,
    reviewId?: string,
    listId?: string,
    watchHistoryId?: string,
    targetUserId?: string,
    metadata?: Record<string, any>
  }): Promise<Activity> {
    try {
      const activity = this.activityRepository.create({
        user_id: data.userId,
        type: data.type,
        movie_id: data.movieId,
        review_id: data.reviewId,
        list_id: data.listId,
        watch_history_id: data.watchHistoryId,
        target_user_id: data.targetUserId,
        metadata: data.metadata
      });

      const savedActivity = await this.activityRepository.save(activity);
      
      // Emit event for notification processing
      this.eventEmitter.emit('activity.created', savedActivity);
      
      // Invalidate user activity cache and feed cache for followers
      this.invalidateActivityCache(data.userId);
      
      return savedActivity;
    } catch (error) {
      this.logger.error(`Error creating activity for user ${data.userId}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to create activity');
    }
  }

  async getUserActivity(userId: string, filters: ActivityFiltersInput = {}): Promise<[Activity[], number]> {
    try {
      const { page = 1, limit = 20, types } = filters;
      const typesKey = types ? types.join(',') : 'all';
      
      const cacheKey = this.cacheKeyFactory.generate('social', 'userActivity', [userId, page, limit, typesKey]);
      
      return this.cacheService.getOrFetch(
        cacheKey,
        async () => {
          const queryBuilder = this.activityRepository.createQueryBuilder('activity')
            .where('activity.user_id = :userId', { userId })
            .leftJoinAndSelect('activity.user', 'user')
            .leftJoinAndSelect('activity.movie', 'movie')
            .leftJoinAndSelect('activity.review', 'review')
            .leftJoinAndSelect('activity.list', 'list')
            .leftJoinAndSelect('activity.targetUser', 'targetUser')
            .leftJoinAndSelect('activity.watchHistory', 'watchHistory')
            .orderBy('activity.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);
          
          if (types && types.length > 0) {
            queryBuilder.andWhere('activity.type IN (:...types)', { types });
          }
          
          return queryBuilder.getManyAndCount();
        },
        EntityCacheTTL.SHORT
      );
    } catch (error) {
      this.logger.error(`Error getting activity for user ${userId}: ${error.message}`, error.stack);
      return [[], 0];
    }
  }

  async getFeedActivity(userId: string, filters: ActivityFiltersInput = {}): Promise<[Activity[], number]> {
    try {
      const { page = 1, limit = 20, types, filter = ActivityFeedFilter.ALL } = filters;
      const typesKey = types ? types.join(',') : 'all';
      
      const cacheKey = this.cacheKeyFactory.generate(
        'social', 
        'feedActivity', 
        [userId, page, limit, typesKey, filter]
      );
      
      return this.cacheService.getOrFetch(
        cacheKey,
        async () => {
          // Get users that the current user is following
          const following = await this.userFollowRepository.find({
            where: { follower_id: userId },
            select: ['following_id']
          });
          
          const followingIds = following.map(f => f.following_id);
          
          // Add current user if not only following filter
          if (filter !== ActivityFeedFilter.FRIENDS) {
            followingIds.push(userId);
          }
          
          // If not following anyone and filter is FRIENDS, return empty result
          if (followingIds.length === 0) {
            return [[], 0];
          }
          
          const queryBuilder = this.activityRepository.createQueryBuilder('activity')
            .where('activity.user_id IN (:...userIds)', { userIds: followingIds })
            .leftJoinAndSelect('activity.user', 'user')
            .leftJoinAndSelect('activity.movie', 'movie')
            .leftJoinAndSelect('activity.review', 'review')
            .leftJoinAndSelect('activity.list', 'list')
            .leftJoinAndSelect('activity.targetUser', 'targetUser')
            .leftJoinAndSelect('activity.watchHistory', 'watchHistory')
            .orderBy('activity.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);
          
          if (types && types.length > 0) {
            queryBuilder.andWhere('activity.type IN (:...types)', { types });
          }
          
          if (filter === ActivityFeedFilter.REVIEWS) {
            queryBuilder.andWhere('activity.type = :reviewType', { reviewType: ActivityType.REVIEWED_MOVIE });
          }
          
          return queryBuilder.getManyAndCount();
        },
        EntityCacheTTL.SHORT
      );
    } catch (error) {
      this.logger.error(`Error getting feed activity for user ${userId}: ${error.message}`, error.stack);
      return [[], 0];
    }
  }

  // Helper methods
  private async invalidateFollowCache(followerId: string, followingId: string): Promise<void> {
    try {
      await Promise.all([
        // Clear specific follow relationship
        this.cacheService.invalidate(
          this.cacheKeyFactory.generate('social', 'isFollowing', [followerId, followingId])
        ),
        
        // Clear follower/following count caches
        this.cacheService.invalidate(
          this.cacheKeyFactory.generate('social', 'followersCount', [followingId])
        ),
        this.cacheService.invalidate(
          this.cacheKeyFactory.generate('social', 'followingCount', [followerId])
        ),
        
        // Clear follower/following list caches
        this.cacheService.invalidatePattern(
          this.cacheKeyFactory.generate('social', 'followers', [followingId])
        ),
        this.cacheService.invalidatePattern(
          this.cacheKeyFactory.generate('social', 'following', [followerId])
        ),
        
        // Invalidate feed activity for both users
        this.invalidateActivityCache(followerId),
        this.invalidateActivityCache(followingId)
      ]);
    } catch (error) {
      this.logger.error(`Error invalidating follow cache: ${error.message}`, error.stack);
    }
  }

  private async invalidateActivityCache(userId: string): Promise<void> {
    try {
      await Promise.all([
        // User's own activity
        this.cacheService.invalidatePattern(
          this.cacheKeyFactory.generate('social', 'userActivity', [userId])
        ),
        
        // User's feed activity
        this.cacheService.invalidatePattern(
          this.cacheKeyFactory.generate('social', 'feedActivity', [userId])
        ),
        
        // Get followers to invalidate their feed caches
        this.getFollowers(userId).then(([followers]) => {
          return Promise.all(
            followers.map(follower => 
              this.cacheService.invalidatePattern(
                this.cacheKeyFactory.generate('social', 'feedActivity', [follower.id])
              )
            )
          );
        })
      ]);
    } catch (error) {
      this.logger.error(`Error invalidating activity cache: ${error.message}`, error.stack);
    }
  }
}