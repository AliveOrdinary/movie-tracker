// src/modules/users/entities/user.entity.ts
import { ObjectType, Field, ID, Int, registerEnumType } from '@nestjs/graphql';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserRole } from '../../../common/enums/roles.enum';
import { ProfileVisibility } from '../../../common/enums/profile-visibility.enum';
import {
  WatchlistDisplayMode,
  ActivityFeedFilter,
  ReviewsSortOrder,
} from '../../../common/enums/profile-settings.enum';
import { Review } from '../../reviews/entities/review.entity';

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
  @Column({ unique: true })
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
  })
  roles: UserRole[];

  // Reviews Relationship
  @Field(() => [Review], { nullable: true })
  @OneToMany(() => Review, review => review.user)
  reviews?: Review[];

  // Profile Settings
  @Field(() => ProfileVisibility)
  @Column({
    type: 'enum',
    enum: ProfileVisibility,
    default: ProfileVisibility.PUBLIC,
  })
  profileVisibility: ProfileVisibility;

  @Field(() => Boolean)
  @Column({ default: false })
  showOnlineStatus: boolean;

  @Field(() => Boolean)
  @Column({ default: true })
  showActivity: boolean;

  @Field(() => Boolean)
  @Column({ default: true })
  allowFriendRequests: boolean;

  @Field(() => Boolean)
  @Column({ default: true })
  showWatchlist: boolean;

  // Notification Settings
  @Field(() => Boolean)
  @Column({ default: true })
  emailNotifications: boolean;

  @Field(() => Boolean)
  @Column({ default: true })
  reviewNotifications: boolean;

  @Field(() => Boolean)
  @Column({ default: true })
  friendRequestNotifications: boolean;

  @Field(() => Boolean)
  @Column({ default: true })
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
  @Column('text', { array: true, nullable: true })
  favoriteGenres?: string[];

  @Field(() => SocialLinks, { nullable: true })
  @Column('jsonb', { default: {} })
  socialLinks: Record<string, string>;

  // Display Preferences
  @Field(() => WatchlistDisplayMode)
  @Column({
    type: 'enum',
    enum: WatchlistDisplayMode,
    default: WatchlistDisplayMode.GRID,
  })
  watchlistDisplayMode: WatchlistDisplayMode;

  @Field(() => ActivityFeedFilter)
  @Column({
    type: 'enum',
    enum: ActivityFeedFilter,
    default: ActivityFeedFilter.ALL,
  })
  activityFeedFilter: ActivityFeedFilter;

  @Field(() => ReviewsSortOrder)
  @Column({
    type: 'enum',
    enum: ReviewsSortOrder,
    default: ReviewsSortOrder.LATEST,
  })
  reviewsSortOrder: ReviewsSortOrder;

  // Account Status
  @Field(() => Boolean)
  @Column({ default: false })
  emailVerified: boolean;

  @Field({ nullable: true })
  @Column({ nullable: true })
  avatarUrl?: string;

  // Moderation Fields
  @Field(() => Boolean)
  @Column({ default: false })
  isBanned: boolean;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  banReason?: string;

  @Field(() => Date, { nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  bannedAt?: Date;

  @Field(() => Date, { nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  suspendedUntil?: Date;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  suspensionReason?: string;

  @Field(() => Int)
  @Column({ default: 0 })
  warningCount: number;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  lastWarningReason?: string;

  @Field(() => Date, { nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  lastWarningAt?: Date;

  // Timestamps
  @Field(() => Date)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn()
  updatedAt: Date;

  @Field(() => Date, { nullable: true })
  @Column({ nullable: true })
  lastLoginAt?: Date;

  @Field(() => Date, { nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  lastActivityAt?: Date;
}