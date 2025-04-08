/**
 * GraphQL operations for review-related functionality
 */

import { gql } from '@apollo/client';

// Fragments
export const REVIEW_FRAGMENT = gql`
  fragment ReviewDetails on Review {
    id
    content
    rating
    createdAt
    helpfulVotes
    status
    containsSpoilers
    isEdited
    reactionCount
    reactionStats {
      type
      count
    }
    userReaction
    user {
      id
      username
      avatarUrl
    }
    movie {
      id
      tmdbId
      title
      posterPath
    }
  }
`;

// Queries
export const GET_USER_REVIEWS = gql`
  query GetUserReviews($filters: UserReviewFilters) {
    myReviews(filters: $filters) {
      ...ReviewDetails
    }
  }
  ${REVIEW_FRAGMENT}
`;

// Mutations
export const CREATE_REVIEW = gql`
  mutation CreateReview($input: CreateReviewInput!) {
    createReview(input: $input) {
      ...ReviewDetails
    }
  }
  ${REVIEW_FRAGMENT}
`;

export const ADD_REACTION = gql`
  mutation AddReaction($input: AddReactionInput!) {
    addReaction(input: $input) {
      id
      reactionCount
      reactionStats {
        type
        count
      }
      userReaction
    }
  }
`;

export const REMOVE_REACTION = gql`
  mutation RemoveReaction($input: RemoveReactionInput!) {
    removeReaction(input: $input) {
      id
      reactionCount
      reactionStats {
        type
        count
      }
      userReaction
    }
  }
`;

export const UPDATE_REVIEW = gql`
  mutation UpdateReview($id: String!, $input: UpdateReviewInput!) {
    updateReview(id: $id, input: $input) {
      ...ReviewDetails
    }
  }
  ${REVIEW_FRAGMENT}
`;

export const DELETE_REVIEW = gql`
  mutation DeleteReview($id: String!) {
    deleteReview(id: $id)
  }
`;

export const FLAG_REVIEW = gql`
  mutation FlagReview($id: String!, $reason: String!) {
    flagReview(id: $id, reason: $reason) {
      id
      isFlagged
    }
  }
`;

// TypeScript interfaces
export interface CreateReviewInput {
  tmdbId: number;  // TMDB ID (number) used for input
  content: string;
  rating: number;
  containsSpoilers?: boolean;
  tags?: string[];
  watchHistoryId?: string;
}

export enum ReactionType {
  LIKE = 'LIKE',
  LOVE = 'LOVE',
  LAUGH = 'LAUGH',
  AGREE = 'AGREE',
  DISAGREE = 'DISAGREE',
  ANGRY = 'ANGRY',
  SAD = 'SAD'
}

export interface ReactionStat {
  type: ReactionType;
  count: number;
}

export interface Review {
  id: string;
  content: string;
  rating: number;
  createdAt: string;
  helpfulVotes: number;
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'FLAGGED';
  containsSpoilers: boolean;
  isEdited: boolean;
  reactionCount: number;
  reactionStats: ReactionStat[];
  userReaction?: ReactionType;
  user: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  movie: {
    id: string;
    tmdbId: number;
    title: string;
    posterPath?: string;
  };
}
