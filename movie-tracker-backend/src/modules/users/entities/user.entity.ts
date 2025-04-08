// src/modules/users/entities/user.entity.ts
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserRole, ProfileVisibility, WatchlistDisplayMode, ActivityFeedFilter, ReviewsSortOrder } from '../../../common/enums';
import { Review } from '../../reviews/entities/review.entity';
import { WatchHistory } from '../../watch-history/entities/watch-history.entity';

@ObjectType()
class SocialLinks {
  @Field(() => String, { nullable: true })
  twitter?: string;

  @Field(() => String, { nullable: true })
  instagram?: string;

  @Field(() => String, { nullable: true })
  facebook?: string;

  @Field(() => String, { nullable: true })
  website?: string;

  @Field(() => String, { nullable: true })
  letterboxd?: string;
}

@ObjectType()
@Entity('users')
export class User {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ unique: true, name: 'firebase_uid' }) 
  firebaseUid: string;

  @Field()
  @Column()
  username: string;

  @Field()
  @Column({ unique: true })
  email: string;

  @Field(() => [UserRole])
  @Column({ 
    type: 'enum',
    enum: UserRole,
    array: true,
    default: [UserRole.USER],
    name: 'roles' 
  }) 
  roles: UserRole[];

  // Reviews Relationship
  @Field(() => [Review], { nullable: true })
  @OneToMany(() => Review, review => review.user)
  reviews?: Review[];

  // Watch History Relationship
  @Field(() => [WatchHistory], { nullable: true })
  @OneToMany(() => WatchHistory, history => history.user)
  watchHistory?: WatchHistory[];

  // Profile Settings
  @Field(() => ProfileVisibility)
  @Column({ 
    type: 'enum',
    enum: ProfileVisibility,
    default: ProfileVisibility.PUBLIC,
    name: 'profile_visibility' 
  }) 
  profileVisibility: ProfileVisibility;

  @Field(() => Boolean)
  @Column({ default: false, name: 'show_online_status' }) 
  showOnlineStatus: boolean;

  @Field(() => Boolean)
  @Column({ default: true, name: 'show_activity' }) 
  showActivity: boolean;

  @Field(() => Boolean)
  @Column({ default: true, name: 'allow_friend_requests' }) 
  allowFriendRequests: boolean;

  @Field(() => Boolean)
  @Column({ default: true, name: 'show_watchlist' }) 
  showWatchlist: boolean;

  // Notification Settings
  @Field(() => Boolean)
  @Column({ default: true, name: 'email_notifications' }) 
  emailNotifications: boolean;

  @Field(() => Boolean)
  @Column({ default: true, name: 'review_notifications' }) 
  reviewNotifications: boolean;

  @Field(() => Boolean)
  @Column({ default: true, name: 'friend_request_notifications' }) 
  friendRequestNotifications: boolean;

  @Field(() => Boolean)
  @Column({ default: true, name: 'watchlist_notifications' }) 
  watchlistNotifications: boolean;

  // Profile Information
  @Field({ nullable: true })
  @Column('text', { nullable: true })
  bio?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  location?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  website?: string;

  @Field(() => [String], { nullable: true })
  @Column('text', { array: true, nullable: true, name: 'favorite_genres' })
  favoriteGenres?: string[];

  @Field(() => SocialLinks, { nullable: true })
  @Column('jsonb', { default: {}, name: 'social_links' })
  socialLinks: Record<string, string>;

  // Display Preferences
  @Field(() => WatchlistDisplayMode)
  @Column({ 
    type: 'enum',
    enum: WatchlistDisplayMode,
    default: WatchlistDisplayMode.GRID,
    name: 'watchlist_display_mode' 
  }) 
  watchlistDisplayMode: WatchlistDisplayMode;

  @Field(() => ActivityFeedFilter)
  @Column({ 
    type: 'enum',
    enum: ActivityFeedFilter,
    default: ActivityFeedFilter.ALL,
    name: 'activity_feed_filter' 
  }) 
  activityFeedFilter: ActivityFeedFilter;

  @Field(() => ReviewsSortOrder)
  @Column({ 
    type: 'enum',
    enum: ReviewsSortOrder,
    default: ReviewsSortOrder.LATEST,
    name: 'reviews_sort_order' 
  }) 
  reviewsSortOrder: ReviewsSortOrder;

  // Account Status
  @Field(() => Boolean)
  @Column({ default: false, name: 'email_verified' }) 
  emailVerified: boolean;

  @Field({ nullable: true })
  @Column({ nullable: true, name: 'avatar_url' })
  avatarUrl?: string;

  // Moderation Fields
  @Field(() => Boolean)
  @Column({ default: false, name: 'is_banned' }) 
  isBanned: boolean;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true, name: 'ban_reason' })
  banReason?: string;

  @Field(() => Date, { nullable: true })
  @Column({ type: 'timestamp', nullable: true, name: 'banned_at' })
  bannedAt?: Date;

  @Field(() => Date, { nullable: true })
  @Column({ type: 'timestamp', nullable: true, name: 'suspended_until' })
  suspendedUntil?: Date;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true, name: 'suspension_reason' })
  suspensionReason?: string;

  @Field(() => Int)
  @Column({ default: 0, name: 'warning_count' }) 
  warningCount: number;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true, name: 'last_warning_reason' })
  lastWarningReason?: string;

  @Field(() => Date, { nullable: true })
  @Column({ type: 'timestamp', nullable: true, name: 'last_warning_at' })
  lastWarningAt?: Date;

  // Timestamps
  @Field(() => Date)
  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  @Field(() => Date, { nullable: true })
  @Column({ type: 'timestamp', nullable: true, name: 'last_login_at' })
  lastLoginAt?: Date;

  @Field(() => Date, { nullable: true })
  @Column({ type: 'timestamp', nullable: true, name: 'last_activity_at' })
  lastActivityAt?: Date;
}