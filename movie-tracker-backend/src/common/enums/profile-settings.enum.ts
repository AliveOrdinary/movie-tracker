//src/common/enums/profile-settings.enum.ts
import { registerEnumType } from '@nestjs/graphql';

export enum WatchlistDisplayMode {
  GRID = 'grid',
  LIST = 'list'
}

export enum ActivityFeedFilter {
  ALL = 'all',
  FRIENDS = 'friends',
  REVIEWS = 'reviews'
}

export enum ReviewsSortOrder {
  LATEST = 'latest',
  RATING = 'rating',
  LIKES = 'likes'
}

registerEnumType(WatchlistDisplayMode, {
  name: 'WatchlistDisplayMode',
  description: 'Display mode for watchlist items',
});

registerEnumType(ActivityFeedFilter, {
  name: 'ActivityFeedFilter',
  description: 'Filter options for activity feed',
});

registerEnumType(ReviewsSortOrder, {
  name: 'ReviewsSortOrder',
  description: 'Sort order for reviews',
});
