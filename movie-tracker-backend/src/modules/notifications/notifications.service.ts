// src/modules/notifications/notifications.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, In } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { Notification, NotificationType } from './entities/notification.entity';
import { NotificationPreference } from './entities/notification-preference.entity';
import { User } from '../users/entities/user.entity';
import { Review } from '../reviews/entities/review.entity';
import { List } from '../lists/entities/list.entity';
import { Movie } from '../movies/entities/movie.entity';
import { NotificationFiltersInput } from './dto/notification-filters.input';
import { NotificationPreferencesInput } from './dto/notification-preferences.input';
import { Activity, ActivityType } from '../social/entities/activity.entity';
import { ReviewEventType } from '../reviews/events/review.events';
import { ReactionType, ListPrivacy } from '../../common/enums';
import { NotificationQueueService } from './services/notification-queue.service';

// Import an event emitter service
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(NotificationPreference)
    private preferenceRepository: Repository<NotificationPreference>,
    private readonly notificationQueueService: NotificationQueueService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createNotification(data: {
    userId: string;
    actorId?: string;
    type: NotificationType;
    message: string;
    reviewId?: string;
    listId?: string;
    movieId?: string;
    metadata?: Record<string, any>;
  }): Promise<Notification | null> {
    try {
      // Skip notification if user doesn't want this type
      const [user, preferences] = await Promise.all([
        this.userRepository.findOne({ where: { id: data.userId } }),
        this.getUserNotificationPreferences(data.userId)
      ]);
      
      if (!user) {
        this.logger.warn(`Attempted to create notification for non-existent user: ${data.userId}`);
        return null;
      }

      // Check if notification type is enabled for this user
      if (!preferences.isTypeEnabled(data.type)) {
        this.logger.debug(`Skipping notification for user ${data.userId} - type ${data.type} is disabled`);
        return null;
      }

      // Create the notification
      const notification = this.notificationRepository.create({
        user_id: data.userId,
        actor_id: data.actorId,
        type: data.type,
        message: data.message,
        review_id: data.reviewId,
        list_id: data.listId,
        movie_id: data.movieId,
        metadata: data.metadata,
        isRead: false
      });

      // Save to database
      const savedNotification = await this.notificationRepository.save(notification);
      
      // Queue for delivery
      this.notificationQueueService.queueNotification(savedNotification);
      
      // Emit event for potential real-time delivery
      this.eventEmitter.emit('notification.created', {
        notification: savedNotification,
        user,
        preferences
      });

      return savedNotification;
    } catch (error) {
      this.logger.error(`Error creating notification: ${error.message}`, error.stack);
      return null;
    }
  }

  async createBulkNotifications(notificationData: Array<{
    userId: string;
    actorId?: string;
    type: NotificationType;
    message: string;
    reviewId?: string;
    listId?: string;
    movieId?: string;
    metadata?: Record<string, any>;
  }>): Promise<Notification[]> {
    try {
      if (notificationData.length === 0) {
        return [];
      }

      // Get all distinct users
      const userIds = [...new Set(notificationData.map(data => data.userId))];
      
      // Get users and their preferences in bulk
      const [users, allPreferences] = await Promise.all([
        this.userRepository.findBy({ id: In(userIds) }),
        this.preferenceRepository.findBy({ userId: In(userIds) })
      ]);

      // Create maps for efficient lookup
      const userMap = new Map<string, User>();
      users.forEach(user => userMap.set(user.id, user));

      const preferenceMap = new Map<string, NotificationPreference>();
      allPreferences.forEach(pref => preferenceMap.set(pref.userId, pref));

      // Filter notifications based on user preferences
      const eligibleNotifications = await Promise.all(notificationData.map(async (data) => {
        // Skip if user not found
        if (!userMap.has(data.userId)) {
          return null;
        }

        // Get preferences or use default
        const preferences = preferenceMap.get(data.userId) || 
          await this.getOrCreateDefaultPreferences(data.userId);

        // Check if notification type is enabled
        return preferences.isTypeEnabled(data.type) ? data : null;
      }));

      // Filter out null values
      const validNotifications = eligibleNotifications.filter(item => item !== null);

      if (validNotifications.length === 0) {
        return [];
      }

      // Create notification entities
      const notifications = validNotifications.map(data => 
        this.notificationRepository.create({
          user_id: data.userId,
          actor_id: data.actorId,
          type: data.type,
          message: data.message,
          review_id: data.reviewId,
          list_id: data.listId,
          movie_id: data.movieId,
          metadata: data.metadata,
          isRead: false
        })
      );

      // Save all notifications in a single transaction
      const savedNotifications = await this.notificationRepository.save(notifications);
      
      // Queue for delivery
      this.notificationQueueService.queueNotifications(savedNotifications);
      
      return savedNotifications;
    } catch (error) {
      this.logger.error(`Error creating bulk notifications: ${error.message}`, error.stack);
      return [];
    }
  }

  async getUserNotifications(
    userId: string, 
    filters: NotificationFiltersInput = {}
  ): Promise<[Notification[], number]> {
    const { page = 1, limit = 20, types, unreadOnly } = filters;
    
    const where: FindOptionsWhere<Notification> = { user_id: userId };
    
    if (types && types.length > 0) {
      where.type = types.length === 1 ? types[0] : types as any;
    }
    
    if (unreadOnly) {
      where.isRead = false;
    }
    
    return this.notificationRepository.findAndCount({
      where,
      relations: ['actor', 'review', 'list', 'movie'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { user_id: userId, isRead: false }
    });
  }

  async markAsRead(notificationId: string, userId: string): Promise<Notification | null> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, user_id: userId }
    });
    
    if (!notification) {
      return null;
    }
    
    notification.isRead = true;
    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: string): Promise<boolean> {
    await this.notificationRepository.update(
      { user_id: userId, isRead: false },
      { isRead: true }
    );
    return true;
  }

  async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    const result = await this.notificationRepository.delete({
      id: notificationId,
      user_id: userId
    });
    
    return result.affected ? result.affected > 0 : false;
  }

  async getUserNotificationPreferences(userId: string): Promise<NotificationPreference> {
    let preferences = await this.preferenceRepository.findOne({
      where: { userId }
    });
    
    if (!preferences) {
      preferences = await this.getOrCreateDefaultPreferences(userId);
    }
    
    return preferences;
  }

  async updateNotificationPreferences(
    userId: string,
    updateDto: NotificationPreferencesInput
  ): Promise<NotificationPreference> {
    let preferences = await this.preferenceRepository.findOne({
      where: { userId }
    });
    
    if (!preferences) {
      preferences = this.preferenceRepository.create({
        userId,
        emailNotifications: true,
        pushNotifications: true,
        reviewNotifications: true,
        friendRequestNotifications: true,
        watchlistNotifications: true,
        movieReleaseNotifications: true,
        systemNotifications: true,
        disabledTypes: []
      });
    }
    
    // Update preferences with provided values
    Object.assign(preferences, updateDto);
    
    // Convert disabledTypes to string array for storage
    if (updateDto.disabledTypes) {
      preferences.disabledTypes = updateDto.disabledTypes as unknown as string[];
    }
    
    return this.preferenceRepository.save(preferences);
  }

  private async getOrCreateDefaultPreferences(userId: string): Promise<NotificationPreference> {
    // Get user to ensure it exists
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });
    
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    // Create default preferences
    const preferences = this.preferenceRepository.create({
      userId,
      emailNotifications: true,
      pushNotifications: true,
      reviewNotifications: true,
      friendRequestNotifications: true,
      watchlistNotifications: true,
      movieReleaseNotifications: true,
      systemNotifications: true,
      disabledTypes: []
    });
    
    return this.preferenceRepository.save(preferences);
  }

  // Event handlers
  @OnEvent('activity.created')
  async handleActivityCreated(activity: Activity): Promise<void> {
    try {
      switch (activity.type) {
        case ActivityType.FOLLOWED_USER:
          if (activity.target_user_id) {
            await this.createNotification({
              userId: activity.target_user_id,
              actorId: activity.user_id,
              type: NotificationType.FOLLOW,
              message: 'started following you',
            });
          }
          break;
          
        // Handle more activity types
        case ActivityType.ADDED_REVIEW:
          // If we have followers, notify them about the new review
          if (activity.review_id) {
            await this.notifyFollowersAboutReview(activity.user_id, activity.review_id);
          }
          break;
          
        case ActivityType.CREATED_LIST:
          // If we have followers, notify them about the new list
          if (activity.list_id) {
            await this.notifyFollowersAboutList(activity.user_id, activity.list_id);
          }
          break;
      }
    } catch (error) {
      this.logger.error(`Error handling activity notification: ${error.message}`, error.stack);
    }
  }

  @OnEvent(ReviewEventType.REACTION_ADDED)
  async handleReviewReaction(data: { review: Review, user: User, reaction: ReactionType }): Promise<void> {
    try {
      // Don't notify if the review author is the same as the reactor
      if (data.review.user?.id === data.user.id) {
        return;
      }
      
      await this.createNotification({
        userId: data.review.user.id,
        actorId: data.user.id,
        type: NotificationType.REVIEW_LIKE,
        message: `reacted to your review of ${data.review.movie?.title || 'a movie'}`,
        reviewId: data.review.id,
        movieId: data.review.movie?.id,
        metadata: { reactionType: data.reaction }
      });
    } catch (error) {
      this.logger.error(`Error handling review reaction notification: ${error.message}`, error.stack);
    }
  }

  @OnEvent('review.comment')
  async handleReviewComment(data: { review: Review, user: User, commentId: string, comment: string }): Promise<void> {
    try {
      // Don't notify if the review author is the same as the commenter
      if (data.review.user?.id === data.user.id) {
        return;
      }
      
      await this.createNotification({
        userId: data.review.user.id,
        actorId: data.user.id,
        type: NotificationType.REVIEW_COMMENT,
        message: `commented on your review of ${data.review.movie?.title || 'a movie'}`,
        reviewId: data.review.id,
        movieId: data.review.movie?.id,
        metadata: { 
          commentId: data.commentId,
          commentPreview: data.comment.substring(0, 50) + (data.comment.length > 50 ? '...' : '')
        }
      });
    } catch (error) {
      this.logger.error(`Error handling review comment notification: ${error.message}`, error.stack);
    }
  }

  @OnEvent('list.favorited')
  async handleListFavorited(data: { list: List, user: User }): Promise<void> {
    try {
      // Don't notify if the list owner is the same as the user favoriting
      if (data.list.owner_id === data.user.id) {
        return;
      }
      
      await this.createNotification({
        userId: data.list.owner_id,
        actorId: data.user.id,
        type: NotificationType.LIST_FAVORITE,
        message: `favorited your list "${data.list.name}"`,
        listId: data.list.id,
      });
    } catch (error) {
      this.logger.error(`Error handling list favorited notification: ${error.message}`, error.stack);
    }
  }

  @OnEvent('list.collaborator.added')
  async handleCollaboratorAdded(data: { list: List, user: User, addedBy: User }): Promise<void> {
    try {
      await this.createNotification({
        userId: data.user.id,
        actorId: data.addedBy.id,
        type: NotificationType.LIST_COLLABORATION,
        message: `added you as a collaborator to "${data.list.name}"`,
        listId: data.list.id,
      });
    } catch (error) {
      this.logger.error(`Error handling collaborator added notification: ${error.message}`, error.stack);
    }
  }

  @OnEvent('movie.release')
  async handleMovieRelease(data: { movie: Movie, releaseDate: Date }): Promise<void> {
    try {
      // Find users who have this movie in their watchlist
      // This would be implemented with a query to find users with this movie in watchlist
      // For now, we'll simulate with a placeholder
      const interestedUserIds: string[] = []; // Replace with actual query

      if (interestedUserIds.length === 0) {
        return;
      }

      // Create notifications in bulk
      const notificationsData = interestedUserIds.map(userId => ({
        userId,
        type: NotificationType.MOVIE_RELEASE,
        message: `${data.movie.title} is now available to watch!`,
        movieId: data.movie.id,
        metadata: { releaseDate: data.releaseDate.toISOString() }
      }));

      await this.createBulkNotifications(notificationsData);
    } catch (error) {
      this.logger.error(`Error handling movie release notification: ${error.message}`, error.stack);
    }
  }

  // Helper method to notify followers about a new review
  private async notifyFollowersAboutReview(userId: string, reviewId: string): Promise<void> {
    try {
      // Get the review with movie details
      const review = await this.getReviewWithMovie(reviewId);
      if (!review || !review.movie) {
        return;
      }

      // Get followers
      const followerIds = await this.getUserFollowers(userId);
      if (followerIds.length === 0) {
        return;
      }

      // Create notifications for all followers
      const notificationsData = followerIds.map(followerId => ({
        userId: followerId,
        actorId: userId,
        type: NotificationType.REVIEW_LIKE, // Using REVIEW_LIKE as a general review notification
        message: `posted a review of ${review.movie.title}`,
        reviewId,
        movieId: review.movie.id
      }));

      await this.createBulkNotifications(notificationsData);
    } catch (error) {
      this.logger.error(`Error notifying followers about review: ${error.message}`, error.stack);
    }
  }

  // Helper method to notify followers about a new list
  private async notifyFollowersAboutList(userId: string, listId: string): Promise<void> {
    try {
      // Get the list
      const list = await this.getList(listId);
      if (!list) {
        return;
      }

      // Only notify for public lists
      if (list.privacy !== ListPrivacy.PUBLIC) {
        return;
      }

      // Get followers
      const followerIds = await this.getUserFollowers(userId);
      if (followerIds.length === 0) {
        return;
      }

      // Create notifications for all followers
      const notificationsData = followerIds.map(followerId => ({
        userId: followerId,
        actorId: userId,
        type: NotificationType.LIST_FAVORITE, // Using LIST_FAVORITE as a general list notification
        message: `created a new list: "${list.name}"`,
        listId
      }));

      await this.createBulkNotifications(notificationsData);
    } catch (error) {
      this.logger.error(`Error notifying followers about list: ${error.message}`, error.stack);
    }
  }

  // Placeholder functions to get data from other services
  // In a real implementation, these would use the appropriate services or repositories
  private async getReviewWithMovie(reviewId: string): Promise<(Review & { movie?: Movie }) | null> {
    // Placeholder - would be replaced with actual repository call
    return null;
  }

  private async getList(listId: string): Promise<List | null> {
    // Placeholder - would be replaced with actual repository call
    return null;
  }

  private async getUserFollowers(userId: string): Promise<string[]> {
    // Placeholder - would be replaced with actual repository call
    return [];
  }
}