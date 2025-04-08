/**
 * GraphQL operations for watch history functionality
 */

import { gql } from '@apollo/client';

// Fragments
export const WATCH_HISTORY_FRAGMENT = gql`
  fragment WatchHistoryDetails on WatchHistory {
    id
    watchedAt
    watchType
    rating
    notes
    watchDuration
    isPrivate
    isFavorite
    contextTags
    moodRating
    watchCount
    createdAt
    updatedAt
    movie {
      id
      tmdbId
      title
      posterPath
      posterUrl
      releaseYear
    }
  }
`;

// Queries
export const GET_WATCH_HISTORY = gql`
  query GetWatchHistory($filters: WatchHistoryFiltersInput, $limit: Float, $page: Float) {
    watchHistory(filters: $filters, limit: $limit, page: $page) {
      ...WatchHistoryDetails
    }
  }
  ${WATCH_HISTORY_FRAGMENT}
`;

export const GET_MOVIE_WATCH_HISTORY = gql`
  query GetMovieWatchHistory($movieId: String!) {
    movieWatchHistory(movieId: $movieId) {
      ...WatchHistoryDetails
    }
  }
  ${WATCH_HISTORY_FRAGMENT}
`;

export const GET_WATCH = gql`
  query GetWatch($id: String!) {
    watch(id: $id) {
      ...WatchHistoryDetails
    }
  }
  ${WATCH_HISTORY_FRAGMENT}
`;

// Mutations
export const CREATE_WATCH = gql`
  mutation CreateWatch($input: CreateWatchInput!) {
    createWatch(input: $input) {
      ...WatchHistoryDetails
    }
  }
  ${WATCH_HISTORY_FRAGMENT}
`;

export const UPDATE_WATCH = gql`
  mutation UpdateWatch($id: String!, $input: UpdateWatchInput!) {
    updateWatch(id: $id, input: $input) {
      ...WatchHistoryDetails
    }
  }
  ${WATCH_HISTORY_FRAGMENT}
`;

export const DELETE_WATCH = gql`
  mutation DeleteWatch($id: String!) {
    deleteWatch(id: $id)
  }
`;

export const TOGGLE_FAVORITE_WATCH = gql`
  mutation ToggleFavoriteWatch($id: String!) {
    toggleFavoriteWatch(id: $id) {
      id
      isFavorite
    }
  }
`;

export const ADD_BULK_WATCHES = gql`
  mutation AddBulkWatches($date: Timestamp!, $tmdbIds: [Int!]!) {
    addBulkWatches(date: $date, tmdbIds: $tmdbIds) {
      id
      movie {
        tmdbId
        title
      }
      watchedAt
    }
  }
`;

// TypeScript interfaces for watch history
export enum WatchType {
  FIRST_TIME = 'FIRST_TIME',
  REWATCH = 'REWATCH',
  PARTIAL = 'PARTIAL'
}

export interface CreateWatchInput {
  tmdbId: number; // Using TMDB ID (number) for input
  watchedAt: Date | string;
  watchType: WatchType;
  rating?: number;
  notes?: string;
  watchDuration?: number;
  isPrivate?: boolean;
  isFavorite?: boolean;
  contextTags?: string;
  moodRating?: number;
}

export interface UpdateWatchInput {
  watchedAt?: Date | string;
  watchType?: WatchType;
  rating?: number;
  notes?: string;
  watchDuration?: number;
  isPrivate?: boolean;
  isFavorite?: boolean;
  contextTags?: string;
  moodRating?: number;
  watchCount?: number;
}

export interface WatchHistoryFiltersInput {
  startDate?: string;
  endDate?: string;
  minRating?: number;
  maxRating?: number;
  onlyFavorites?: boolean;
  includePrivate?: boolean;
  watchType?: WatchType;
  tagFilter?: string;
  searchTerm?: string;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

export interface WatchHistory {
  id: string;
  watchedAt: string;
  watchType: WatchType;
  rating?: number;
  notes?: string;
  watchDuration?: number;
  isPrivate: boolean;
  isFavorite?: boolean;
  contextTags?: string;
  moodRating?: number;
  watchCount: number;
  createdAt: string;
  updatedAt: string;
  movie: {
    id: string;
    tmdbId: number;
    title: string;
    posterPath?: string;
    posterUrl?: string;
    releaseYear?: number;
  };
}
