# Admin API Examples

This document contains GraphQL query examples for the admin API, which can be used in GraphQL Playground to test the functionality.

## Dashboard Statistics

```graphql
query GetAdminDashboard {
  adminDashboard {
    users {
      total
      newToday
      newLastWeek
      newLastMonth
      activeToday
      activeLastWeek
      roleDistribution {
        role
        count
        percentage
      }
    }
    content {
      totalReviews
      newReviewsToday
      pendingReviews
      flaggedReviews
      totalMovies
      totalLists
      totalWatches
    }
    moderation {
      pendingReports
      resolvedReports
      moderationLogsToday
      totalModerationLogs
    }
  }
}
```

## User Management

### Get Users with Filtering

```graphql
query GetUsers($query: String, $role: UserRole, $page: Int, $limit: Int) {
  users(query: $query, role: $role, page: $page, limit: $limit) {
    items {
      id
      username
      email
      roles
      createdAt
      isBanned
      emailVerified
    }
    total
    page
    totalPages
  }
}
```

### User Detail with Statistics

```graphql
query GetUserDetail($userId: ID!) {
  userWithDetails(userId: $userId) {
    id
    username
    email
    roles
    createdAt
    lastLoginAt
    lastActivityAt
    isBanned
    banReason
    bannedAt
    suspendedUntil
    suspensionReason
    warningCount
    lastWarningAt
    stats {
      content {
        reviewCount
        avgReviewRating
        listCount
        watchCount
      }
      activity {
        firstWatchDate
        lastActivityDate
        daysActive
      }
    }
  }
}
```

### Ban a User

```graphql
mutation BanUser($userId: ID!, $reason: String!) {
  banUser(userId: $userId, reason: $reason) {
    id
    username
    email
    isBanned
    banReason
    bannedAt
  }
}
```

### Unban a User

```graphql
mutation UnbanUser($userId: ID!) {
  unbanUser(userId: $userId) {
    id
    username
    email
    isBanned
  }
}
```

### Update User Role

```graphql
mutation UpdateUserRole($userId: ID!, $role: UserRole!, $add: Boolean!) {
  updateUserRole(userId: $userId, role: $role, add: $add) {
    id
    username
    roles
  }
}
```

### Bulk Update Users

```graphql
mutation BulkUpdateUsers($userIds: [ID!]!, $operation: String!, $options: BulkUserOperationOptions!) {
  bulkUpdateUsers(userIds: $userIds, operation: $operation, options: $options) {
    successCount
    failureCount
    errors
  }
}
```

## Content Management

### Get Flagged Reviews

```graphql
query GetFlaggedReviews($page: Int, $limit: Int) {
  flaggedReviews(page: $page, limit: $limit) {
    id
    content
    rating
    createdAt
    user {
      id
      username
    }
    movie {
      id
      title
    }
    isFlagged
    moderationReason
  }
}
```

### Approve Review

```graphql
mutation ApproveReview($reviewId: ID!) {
  approveReview(id: $reviewId) {
    id
    status
    moderatedAt
  }
}
```

### Reject Review

```graphql
mutation RejectReview($reviewId: ID!, $reason: String!) {
  rejectReview(id: $reviewId, reason: $reason) {
    id
    status
    moderationReason
    moderatedAt
  }
}
```

### Set Movie as Popular

```graphql
mutation SetMoviePopular($movieId: ID!, $isPopular: Boolean!) {
  setMoviePopular(movieId: $movieId, isPopular: $isPopular)
}
```

### Feature a List

```graphql
mutation FeatureList($listId: ID!, $featured: Boolean!) {
  featureList(listId: $listId, featured: $featured)
}
```

### Bulk Operations on Content

```graphql
mutation BulkApproveReviews($input: BulkContentOperationInput!) {
  bulkApproveReviews(input: $input) {
    successCount
    failureCount
    errors
  }
}
```

## System Configuration

### Get All Configurations

```graphql
query GetSystemConfigs {
  systemConfigs {
    key
    value
    category
    description
    createdAt
    updatedAt
  }
}
```

### Get Configuration by Category

```graphql
query GetConfigsByCategory($category: ConfigCategory!) {
  systemConfigsByCategory(category: $category) {
    key
    value
    description
  }
}
```

### Update System Configuration

```graphql
mutation UpdateSystemConfig($input: UpdateSystemConfigInput!) {
  updateSystemConfig(input: $input) {
    key
    value
    category
    updatedAt
  }
}
```

### Initialize Default Configurations

```graphql
mutation InitializeDefaultConfigs {
  initializeDefaultConfigs
}
```

## Audit Logs

### Get Audit Logs

```graphql
query GetAuditLogs($filters: AuditLogFiltersInput) {
  adminAuditLogs(filters: $filters) {
    items {
      id
      action
      actionType
      details
      entityId
      entityType
      admin {
        id
        username
      }
      timestamp
    }
    total
    page
    totalPages
  }
}
```

### Get Recent Admin Actions

```graphql
query GetMyRecentActions($limit: Int) {
  myRecentAdminActions(limit: $limit) {
    id
    action
    actionType
    details
    timestamp
  }
}
```

## System Monitoring

### Get System Stats

```graphql
query GetSystemStats {
  systemStats {
    memory {
      totalMemory
      freeMemory
      usedMemory
      usagePercentage
    }
    cpu {
      cpuUsage
      numCores
    }
    database {
      totalTables
      totalRows
      databaseSize
      activeConnections
    }
    health {
      status
      timestamp
      issues
    }
    uptime
  }
}
```

### Check Database Health

```graphql
query CheckDatabaseHealth {
  checkServiceHealth
}
```

## Analytics

### User Registration Trends

```graphql
query GetUserRegistrationTrends($timeframe: String, $period: Int) {
  userRegistrationTrends(timeframe: $timeframe, period: $period) {
    label
    timeframe
    data {
      date
      value
    }
  }
}
```

### Watch Activity Trends

```graphql
query GetWatchActivityTrends($timeframe: String, $period: Int) {
  watchActivityTrends(timeframe: $timeframe, period: $period) {
    label
    timeframe
    data {
      date
      value
    }
  }
}
```

### Genre Analytics

```graphql
query GetGenreAnalytics {
  genreAnalytics {
    genre
    count
    percentage
  }
}
```

### Popular Content

```graphql
query GetPopularContentAnalytics($limit: Int) {
  popularContentAnalytics(limit: $limit) {
    mostWatchedMovies {
      id
      title
      watchCount
    }
    mostReviewedMovies {
      id
      title
      reviewCount
    }
    popularLists {
      id
      name
      favoriteCount
    }
  }
}
```
