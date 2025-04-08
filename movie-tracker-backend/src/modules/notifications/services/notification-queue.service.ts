// src/modules/notifications/services/notification-queue.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, MoreThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { Notification } from '../entities/notification.entity';
import { User } from '../../users/entities/user.entity';
import { NotificationPreference } from '../entities/notification-preference.entity';
import { NotificationDeliveryService } from './notification-delivery.service';

// Interface for queued notifications
interface QueuedNotification {
  notification: Notification;
  userId: string;
  createdAt: Date;
  processed: boolean;
  processingAttempts: number;
}

@Injectable()
export class NotificationQueueService implements OnModuleInit {
  private readonly logger = new Logger(NotificationQueueService.name);
  private notificationQueue: QueuedNotification[] = [];
  private isProcessing = false;
  private readonly maxProcessingAttempts = 3;
  private readonly batchSize = 50;

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(NotificationPreference)
    private preferenceRepository: Repository<NotificationPreference>,
    private notificationDeliveryService: NotificationDeliveryService,
    private configService: ConfigService,
  ) {}

  // Initialize the service
  async onModuleInit() {
    // Load any unprocessed notifications from the database
    // This would recover notifications in case of service restart
    await this.loadUnprocessedNotifications();
  }

  // Add a notification to the queue
  async queueNotification(notification: Notification): Promise<void> {
    this.notificationQueue.push({
      notification,
      userId: notification.user_id,
      createdAt: new Date(),
      processed: false,
      processingAttempts: 0,
    });

    this.logger.debug(`Notification queued: ${notification.id} for user ${notification.user_id}`);
    
    // Process immediately if queue was empty
    if (this.notificationQueue.length === 1 && !this.isProcessing) {
      this.processQueue();
    }
  }

  // Add multiple notifications to the queue
  async queueNotifications(notifications: Notification[]): Promise<void> {
    if (notifications.length === 0) return;

    notifications.forEach(notification => {
      this.notificationQueue.push({
        notification,
        userId: notification.user_id,
        createdAt: new Date(),
        processed: false,
        processingAttempts: 0,
      });
    });

    this.logger.debug(`Queued ${notifications.length} notifications`);
    
    // Process immediately if queue was previously empty
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  // Process the notification queue
  @Cron(CronExpression.EVERY_MINUTE)
  async processQueue(): Promise<void> {
    if (this.isProcessing || this.notificationQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    this.logger.log(`Processing notification queue - ${this.notificationQueue.length} items remaining`);

    try {
      // Take next batch from queue
      const batch = this.notificationQueue
        .filter(item => !item.processed && item.processingAttempts < this.maxProcessingAttempts)
        .slice(0, this.batchSize);

      if (batch.length === 0) {
        // No eligible notifications to process
        this.isProcessing = false;
        return;
      }

      // Group by user ID for more efficient processing
      const userIds = [...new Set(batch.map(item => item.userId))];
      const users = await this.userRepository.findBy({ id: In(userIds) });
      const preferences = await this.preferenceRepository.findBy({ userId: In(userIds) });

      // Map users and preferences by ID for easy lookup
      const userMap = new Map<string, User>();
      users.forEach(user => userMap.set(user.id, user));

      const preferenceMap = new Map<string, NotificationPreference>();
      preferences.forEach(pref => preferenceMap.set(pref.userId, pref));

      // Create delivery items
      const deliveryItems = batch
        .filter(item => userMap.has(item.userId))
        .map(item => {
          const user = userMap.get(item.userId);
          const preference = preferenceMap.get(item.userId) || this.createDefaultPreference(item.userId);

          // Mark as processed to avoid re-processing
          item.processingAttempts += 1;
          
          return {
            notification: item.notification,
            user: user!, // Use the non-null assertion operator
            preferences: preference
          };
        });

      // Deliver notifications in batch
      if (deliveryItems.length > 0) {
        await this.notificationDeliveryService.batchDeliverNotifications(deliveryItems);
      }

      // Mark successfully processed items
      batch.forEach(item => {
        if (item.processingAttempts >= this.maxProcessingAttempts) {
          item.processed = true;
          this.logger.warn(`Notification ${item.notification.id} exceeded max processing attempts`);
        } else if (userMap.has(item.userId)) {
          item.processed = true;
        }
      });

      // Remove processed items from queue
      this.notificationQueue = this.notificationQueue.filter(item => !item.processed);

      this.logger.log(`Processed batch of ${batch.length} notifications. ${this.notificationQueue.length} remaining.`);

      // Continue processing if there are more items
      if (this.notificationQueue.length > 0) {
        setTimeout(() => this.processQueue(), 1000); // Small delay to avoid CPU spiking
      }
    } catch (error) {
      this.logger.error(`Error processing notification queue: ${error.message}`, error.stack);
    } finally {
      this.isProcessing = false;
    }
  }

  // Helper method to create default preferences if not found
  private createDefaultPreference(userId: string): NotificationPreference {
    // Create a placeholder default notification preference object
    const defaultPreference = new NotificationPreference();
    defaultPreference.id = 'default';
    defaultPreference.userId = userId;
    defaultPreference.emailNotifications = true;
    defaultPreference.pushNotifications = true;
    defaultPreference.reviewNotifications = true;
    defaultPreference.friendRequestNotifications = true;
    defaultPreference.watchlistNotifications = true;
    defaultPreference.movieReleaseNotifications = true;
    defaultPreference.systemNotifications = true;
    defaultPreference.disabledTypes = [];
    defaultPreference.createdAt = new Date();
    defaultPreference.updatedAt = new Date();
    
    // Stub method for type checking
    defaultPreference.isTypeEnabled = function(type) { return true; };
    
    return defaultPreference;
  }

  // Load any unprocessed notifications after service restart
  private async loadUnprocessedNotifications(): Promise<void> {
    try {
      // In a real implementation, we would have a flag in the database to track processed status
      // Here we'll load recent notifications as a placeholder
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);
      
      const recentNotifications = await this.notificationRepository.find({
        where: {
          // Get notifications from the last hour that might not have been processed
          createdAt: MoreThan(oneHourAgo)
        },
        take: 1000,
        order: { createdAt: 'DESC' }
      });

      if (recentNotifications.length > 0) {
        this.logger.log(`Loaded ${recentNotifications.length} recent notifications to process`);
        await this.queueNotifications(recentNotifications);
      }
    } catch (error) {
      this.logger.error(`Error loading unprocessed notifications: ${error.message}`, error.stack);
    }
  }
}