// src/types/auth.ts

export enum UserRole {
  USER = 'USER',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN'
}

export enum ProfileVisibility {
  PUBLIC = 'PUBLIC',
  FRIENDS_ONLY = 'FRIENDS_ONLY',
  PRIVATE = 'PRIVATE'
}

export enum WatchlistDisplayMode {
  GRID = 'GRID',
  LIST = 'LIST',
  DETAIL = 'DETAIL'
}

export enum ActivityFeedFilter {
  ALL = 'ALL',
  FRIENDS = 'FRIENDS',
  REVIEWS = 'REVIEWS'
}

export enum ReviewsSortOrder {
  LATEST = 'LATEST',
  OLDEST = 'OLDEST',
  RATING_HIGH = 'RATING_HIGH',
  RATING_LOW = 'RATING_LOW',
  MOST_POPULAR = 'MOST_POPULAR'
}

export interface User {
  id: string;
  email: string;
  username: string;
  roles: UserRole[];
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  lastActivityAt?: Date;
  avatarUrl?: string;
  isBanned: boolean;
  bannedAt?: Date;
  suspendedUntil?: Date;
  warningCount: number;
  lastWarningAt?: Date;
  profileVisibility: ProfileVisibility;
  showOnlineStatus: boolean;
  showActivity: boolean;
  allowFriendRequests: boolean;
  showWatchlist: boolean;
  watchlistDisplayMode: WatchlistDisplayMode;
  activityFeedFilter: ActivityFeedFilter;
  reviewsSortOrder: ReviewsSortOrder;
}

export interface LoginInput {
  firebaseUid: string;
}

export interface LoginResponse {
  token?: string;
  user: User;
}

export interface InitiatePasswordResetInput {
  email: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface ResetPasswordInput {
  email: string;
  newPassword: string;
}
