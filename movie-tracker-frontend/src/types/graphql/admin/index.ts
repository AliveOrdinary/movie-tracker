// src/graphql/admin/index.ts
import { gql } from '@apollo/client';

export const ADMIN_STATS_QUERY = gql`
  query GetAdminDashboardStats {
    adminDashboardStats {
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
        totalLists
        totalMovies
        totalWatches
        newReviewsToday
        pendingReviews
        flaggedReviews
      }
      moderation {
        totalModerationLogs
        moderationLogsToday
        pendingReports
        resolvedReports
      }
    }
  }
`;

export const RECENT_ACTIVITY_QUERY = gql`
  query GetUserActivity($userId: String!, $filters: ActivityFiltersInput) {
    userActivity(userId: $userId, filters: $filters) {
      items {
        id
        type
        user {
          id
          username
        }
        createdAt
        metadata
      }
      page
      total
      totalPages
    }
  }
`;

export const FLAGGED_REVIEWS_QUERY = gql`
  query GetFlaggedReviews($limit: Int! = 10, $page: Int! = 1) {
    flaggedReviews(limit: $limit, page: $page) {
      id
      content
      rating
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
      createdAt
    }
  }
`;

// Admin mutations
export const UPDATE_USER_ROLE_MUTATION = gql`
  mutation UpdateUserRole($userId: String!, $role: UserRole!, $add: Boolean! = true) {
    updateUserRole(userId: $userId, role: $role, add: $add) {
      id
      roles
    }
  }
`;

export const BAN_USER_MUTATION = gql`
  mutation BanUser($userId: String!, $reason: String!) {
    banUser(userId: $userId, reason: $reason) {
      id
      isBanned
      banReason
    }
  }
`;

export const APPROVE_REVIEW_MUTATION = gql`
  mutation ApproveReview($id: String!) {
    approveReview(id: $id) {
      id
      status
      moderatedAt
    }
  }
`;

export const REJECT_REVIEW_MUTATION = gql`
  mutation RejectReview($id: String!, $reason: String!) {
    rejectReview(id: $id, reason: $reason) {
      id
      status
      moderationReason
      moderatedAt
    }
  }
`;