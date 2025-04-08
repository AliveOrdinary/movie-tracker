// src/common/enums/index.ts

// User related enums
export enum UserRole {
  USER = 'USER',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN'
}

export enum ProfileVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  FRIENDS_ONLY = 'FRIENDS_ONLY'
}

// Watch history and display preferences
export enum WatchType {
  FIRST_TIME = 'FIRST_TIME',
  REWATCH = 'REWATCH',
  PARTIAL = 'PARTIAL'
}

export enum WatchlistDisplayMode {
  LIST = 'LIST',
  GRID = 'GRID',
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

// Content status enums
export enum ReviewStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  FLAGGED = 'FLAGGED'
}

// List related enums
export enum ListType {
  STANDARD = 'STANDARD',
  CUSTOM = 'CUSTOM'
}

export enum ListPrivacy {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  FOLLOWING = 'FOLLOWING'
}

export enum CollaboratorPermission {
  VIEW = 'VIEW',
  ADD_ITEMS = 'ADD_ITEMS',
  REMOVE_ITEMS = 'REMOVE_ITEMS',
  EDIT_DETAILS = 'EDIT_DETAILS',
  INVITE_OTHERS = 'INVITE_OTHERS'
}

// GraphQL-friendly enum names (uppercase for input)
export enum GraphQLListType {
  STANDARD = 'STANDARD',
  CUSTOM = 'CUSTOM'
}

export enum GraphQLListPrivacy {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  FOLLOWING = 'FOLLOWING'
}

export enum GraphQLCollaboratorPermission {
  VIEW = 'VIEW',
  ADD_ITEMS = 'ADD_ITEMS',
  REMOVE_ITEMS = 'REMOVE_ITEMS',
  EDIT_DETAILS = 'EDIT_DETAILS',
  INVITE_OTHERS = 'INVITE_OTHERS'
}

// Social module enums
export enum FriendRequestStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  CANCELED = 'CANCELED'
}

export enum GroupPrivacy {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  INVITATION = 'INVITATION'
}

export enum SocialGroupMemberRole {
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  MEMBER = 'MEMBER'
}

// Reaction system
export enum ReactionType {
  LIKE = 'LIKE',
  LOVE = 'LOVE',
  LAUGH = 'LAUGH',
  SAD = 'SAD',
  ANGRY = 'ANGRY',
  AGREE = 'AGREE',
  DISAGREE = 'DISAGREE'
}

// Moderation related enums
export enum ModerationAction {
  REVIEW_APPROVED = 'REVIEW_APPROVED',
  REVIEW_REJECTED = 'REVIEW_REJECTED',
  REVIEW_FLAGGED = 'REVIEW_FLAGGED',
  LIST_APPROVED = 'LIST_APPROVED',
  LIST_REJECTED = 'LIST_REJECTED',
  LIST_FLAGGED = 'LIST_FLAGGED',
  USER_WARNED = 'USER_WARNED',
  USER_SUSPENDED = 'USER_SUSPENDED',
  USER_BANNED = 'USER_BANNED'
}

export enum ReportStatus {
  PENDING = 'PENDING',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED'
}

export enum ReportResolution {
  DISMISS = 'DISMISS',
  WARNING = 'WARNING',
  DELETE = 'DELETE'
}