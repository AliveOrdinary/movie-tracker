// src/modules/notifications/notifications.resolver.ts
import { Resolver, Query, Mutation, Args, Int, ObjectType, Field } from '@nestjs/graphql';
import { UserRole } from '../../common/enums';
import { NotFoundException, UseGuards, UnauthorizedException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { Notification, NotificationType } from './entities/notification.entity';
import { NotificationPreference } from './entities/notification-preference.entity';
import { NotificationFiltersInput } from './dto/notification-filters.input';
import { NotificationPreferencesInput } from './dto/notification-preferences.input';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ObjectType()
class NotificationResponse {
  @Field(() => [Notification])
  items: Notification[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  totalPages: number;

  @Field(() => Int)
  unreadCount: number;
}

@Resolver(() => Notification)
@UseGuards(AuthGuard)
export class NotificationsResolver {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Query(() => NotificationResponse)
  async notifications(
    @CurrentUser() user: User,
    @Args('filters', { nullable: true }) filters?: NotificationFiltersInput,
  ): Promise<NotificationResponse> {
    const [items, total] = await this.notificationsService.getUserNotifications(user.id, filters);
    const unreadCount = await this.notificationsService.getUnreadCount(user.id);
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    
    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      unreadCount
    };
  }

  @Query(() => Int)
  async unreadNotificationCount(
    @CurrentUser() user: User,
  ): Promise<number> {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Query(() => NotificationPreference)
  async notificationPreferences(
    @CurrentUser() user: User,
  ): Promise<NotificationPreference> {
    return this.notificationsService.getUserNotificationPreferences(user.id);
  }

  @Mutation(() => Notification)
  async markNotificationAsRead(
    @CurrentUser() user: User,
    @Args('id') id: string,
  ): Promise<Notification> {
    const notification = await this.notificationsService.markAsRead(id, user.id);
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    return notification;
  }

  @Mutation(() => Boolean)
  async markAllNotificationsAsRead(
    @CurrentUser() user: User,
  ): Promise<boolean> {
    return this.notificationsService.markAllAsRead(user.id);
  }

  @Mutation(() => Boolean)
  async deleteNotification(
    @CurrentUser() user: User,
    @Args('id') id: string,
  ): Promise<boolean> {
    return this.notificationsService.deleteNotification(id, user.id);
  }

  @Mutation(() => NotificationPreference)
  async updateNotificationPreferences(
    @CurrentUser() user: User,
    @Args('input') input: NotificationPreferencesInput,
  ): Promise<NotificationPreference> {
    return this.notificationsService.updateNotificationPreferences(user.id, input);
  }

  // Admin-only operations
  @Mutation(() => Notification)
  async sendSystemNotification(
    @CurrentUser() currentUser: User,
    @Args('userId') userId: string,
    @Args('message') message: string,
    @Args('metadata', { nullable: true }) metadata?: string,
  ): Promise<Notification> {
    // Check if current user is an admin
    if (!currentUser.roles.includes(UserRole.ADMIN)) {
      throw new UnauthorizedException('Only administrators can send system notifications');
    }

    const notificationData = {
      userId,
      type: NotificationType.SYSTEM_MESSAGE,
      message,
      metadata: metadata ? JSON.parse(metadata) : undefined
    };

    const notification = await this.notificationsService.createNotification(notificationData);
    if (!notification) {
      throw new Error('Failed to create system notification');
    }

    return notification;
  }

  @Mutation(() => Boolean)
  async sendBulkSystemNotification(
    @CurrentUser() currentUser: User,
    @Args('userIds', { type: () => [String] }) userIds: string[],
    @Args('message') message: string,
    @Args('metadata', { nullable: true }) metadata?: string,
  ): Promise<boolean> {
    // Check if current user is an admin
    if (!currentUser.roles.includes(UserRole.ADMIN)) {
      throw new UnauthorizedException('Only administrators can send system notifications');
    }

    const notificationData = userIds.map(userId => ({
      userId,
      type: NotificationType.SYSTEM_MESSAGE,
      message,
      metadata: metadata ? JSON.parse(metadata) : undefined
    }));

    const notifications = await this.notificationsService.createBulkNotifications(notificationData);
    
    return notifications.length > 0;
  }
}