// src/common/enums/graphql-enums.ts
import { registerEnumType } from '@nestjs/graphql';
import {
  UserRole,
  ProfileVisibility,
  WatchType,
  WatchlistDisplayMode,
  ActivityFeedFilter,
  ReviewsSortOrder,
  ReviewStatus,
  ListType,
  ListPrivacy,
  CollaboratorPermission,
  ReactionType,
  ModerationAction,
  ReportStatus,
  ReportResolution,
  // New social module enums
  FriendRequestStatus,
  GroupPrivacy,
  SocialGroupMemberRole
} from './index';

// Import additional enums from other modules
import { ReputationLevel } from '../../modules/moderation/entities/user-reputation.entity';
import { RuleType, RuleAction } from '../../modules/moderation/entities/auto-moderation-rule.entity';
import { NotificationType } from '../../modules/notifications/entities/notification.entity';
import { ActivityType } from '../../modules/social/entities/activity.entity';


// Register all enums used in GraphQL resolvers

// User related enums
registerEnumType(UserRole, {
  name: 'UserRole',
  description: 'User role enumeration',
});

registerEnumType(ProfileVisibility, {
  name: 'ProfileVisibility',
  description: 'Profile visibility settings',
});

// Watch history and display preferences
registerEnumType(WatchType, {
  name: 'WatchType',
  description: 'Type of watch (first time or rewatch)',
});

registerEnumType(WatchlistDisplayMode, {
  name: 'WatchlistDisplayMode',
  description: 'Display mode for watchlist',
});

registerEnumType(ActivityFeedFilter, {
  name: 'ActivityFeedFilter',
  description: 'Filter options for activity feed',
});

registerEnumType(ReviewsSortOrder, {
  name: 'ReviewsSortOrder',
  description: 'Sort order for reviews',
});

// Content status enums
registerEnumType(ReviewStatus, {
  name: 'ReviewStatus',
  description: 'Status of a review',
});

// List related enums
registerEnumType(ListType, {
  name: 'ListType',
  description: 'Type of list (standard or custom)',
});

registerEnumType(ListPrivacy, {
  name: 'ListPrivacy',
  description: 'Privacy level of a list',
});

registerEnumType(CollaboratorPermission, {
  name: 'CollaboratorPermission',
  description: 'Permission level for list collaborators',
});

// Social module enums
registerEnumType(FriendRequestStatus, {
  name: 'FriendRequestStatus',
  description: 'Status of a friend request',
});

registerEnumType(GroupPrivacy, {
  name: 'GroupPrivacy',
  description: 'Privacy level of a social group',
});

registerEnumType(SocialGroupMemberRole, {
  name: 'SocialGroupMemberRole',
  description: 'Role of a member in a social group',
});

// Reaction system
registerEnumType(ReactionType, {
  name: 'ReactionType',
  description: 'Type of reaction on a review or activity',
});

// Moderation related enums
registerEnumType(ModerationAction, {
  name: 'ModerationAction',
  description: 'Type of moderation action',
});

registerEnumType(ReportStatus, {
  name: 'ReportStatus',
  description: 'Status of a content report',
});

registerEnumType(ReportResolution, {
  name: 'ReportResolution',
  description: 'Resolution type for a report',
});

// User reputation system
registerEnumType(ReputationLevel, {
  name: 'ReputationLevel',
  description: 'User reputation level',
});

// Auto-moderation system
registerEnumType(RuleType, {
  name: 'RuleType',
  description: 'Type of auto-moderation rule',
});

registerEnumType(RuleAction, {
  name: 'RuleAction',
  description: 'Action to take when an auto-moderation rule is triggered',
});

// Notification system
registerEnumType(NotificationType, {
  name: 'NotificationType',
  description: 'Type of notification',
});

// Activity system
registerEnumType(ActivityType, {
  name: 'ActivityType',
  description: 'Type of user activity',
});

// Removed SortField and SortDirection enums since we're using string sorting
