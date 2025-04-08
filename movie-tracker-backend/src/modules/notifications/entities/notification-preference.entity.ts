// src/modules/notifications/entities/notification-preference.entity.ts
import { ObjectType, Field, ID } from '@nestjs/graphql';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { NotificationType } from './notification.entity';

@ObjectType()
@Entity('notification_preferences')
export class NotificationPreference {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @Field(() => Boolean)
  @Column({ default: true , name: 'email_notifications' }) emailNotifications: boolean;

  @Field(() => Boolean)
  @Column({ default: true , name: 'push_notifications' }) pushNotifications: boolean;

  @Field(() => Boolean)
  @Column({ default: true , name: 'review_notifications' }) reviewNotifications: boolean;

  @Field(() => Boolean)
  @Column({ default: true , name: 'friend_request_notifications' }) friendRequestNotifications: boolean;

  @Field(() => Boolean)
  @Column({ default: true , name: 'watchlist_notifications' }) watchlistNotifications: boolean;

  @Field(() => Boolean)
  @Column({ default: true , name: 'movie_release_notifications' }) movieReleaseNotifications: boolean;

  @Field(() => Boolean)
  @Column({ default: true , name: 'system_notifications' }) systemNotifications: boolean;

  @Field(() => [String])
  @Column('text', { array: true, default: [] })
  disabledTypes: string[];

  @Field()
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;

  @Field()
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;

  // Helper method to check if a notification type is enabled
  isTypeEnabled(type: NotificationType): boolean {
    // First check if notification category is enabled
    switch (type) {
      case NotificationType.REVIEW_LIKE:
      case NotificationType.REVIEW_COMMENT:
        if (!this.reviewNotifications) return false;
        break;
      case NotificationType.FOLLOW:
        if (!this.friendRequestNotifications) return false;
        break;
      case NotificationType.LIST_FAVORITE:
      case NotificationType.LIST_COLLABORATION:
        if (!this.watchlistNotifications) return false;
        break;
      case NotificationType.MOVIE_RELEASE:
        if (!this.movieReleaseNotifications) return false;
        break;
      case NotificationType.SYSTEM_MESSAGE:
        if (!this.systemNotifications) return false;
        break;
    }

    // Then check if specific type is disabled
    return !this.disabledTypes.includes(type);
  }
}