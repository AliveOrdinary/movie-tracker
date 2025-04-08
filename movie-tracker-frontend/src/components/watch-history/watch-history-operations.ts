import { gql } from '@apollo/client';

// Create Watch Mutation
export const CREATE_WATCH = gql`
  mutation CreateWatch($input: CreateWatchInput!) {
    createWatch(input: $input) {
      id
      watchedAt
      watchType
      rating
      notes
      isFavorite
      isPrivate
      watchDuration
      moodRating
      watchCount
      user {
        id
        username
      }
      # Note: Don't query movie fields directly due to schema issue
    }
  }
`;

// Update Watch Mutation
export const UPDATE_WATCH = gql`
  mutation UpdateWatch($id: String!, $input: UpdateWatchInput!) {
    updateWatch(id: $id, input: $input) {
      id
      watchedAt
      watchType
      rating
      notes
      isFavorite
      isPrivate
      watchDuration
      moodRating
      watchCount
    }
  }
`;

// Delete Watch Mutation
export const DELETE_WATCH = gql`
  mutation DeleteWatch($id: String!) {
    deleteWatch(id: $id)
  }
`;

// Toggle Favorite Watch Mutation
export const TOGGLE_FAVORITE_WATCH = gql`
  mutation ToggleFavoriteWatch($id: String!) {
    toggleFavoriteWatch(id: $id) {
      id
      isFavorite
    }
  }
`;

// Watch History Query
export const GET_WATCH_HISTORY = gql`
  query WatchHistory($filters: WatchHistoryFiltersInput, $limit: Float, $page: Float) {
    watchHistory(filters: $filters, limit: $limit, page: $page) {
      id
      watchedAt
      watchType
      rating
      notes
      isFavorite
      isPrivate
      watchDuration
      moodRating
      watchCount
      user {
        id
        username
      }
      # Note: Don't query movie fields directly due to schema issue
    }
  }
`;

// Single Watch Query
export const GET_WATCH = gql`
  query GetWatch($id: String!) {
    watch(id: $id) {
      id
      watchedAt
      watchType
      rating
      notes
      isFavorite
      isPrivate
      watchDuration
      moodRating
      watchCount
      user {
        id
        username
      }
      # Note: Don't query movie fields directly due to schema issue
    }
  }
`;

// Movie Watch History Query
export const GET_MOVIE_WATCH_HISTORY = gql`
  query MovieWatchHistory($movieId: String!) {
    movieWatchHistory(movieId: $movieId) {
      id
      watchedAt
      watchType
      rating
      notes
      isFavorite
      watchCount
      isPrivate
    }
  }
`;

// Watch Statistics Query
export const GET_WATCH_STATS = gql`
  query WatchStats {
    watchStats {
      totalWatch
      uniqueMovies
      averageRating
      totalWatchTime
      favoriteCount
      firstWatchDate
      lastWatchDate
      averageWatchesPerMovie
      averageMoodRating
      genreDistribution {
        genre
        count
        percentage
      }
      watchTypeDistribution {
        type
        count
        percentage
      }
      yearDistribution {
        year
        count
        percentage
      }
      monthlyWatchCounts {
        year
        month
        count
      }
    }
  }
`;

// User Watch Statistics Query
export const GET_USER_WATCH_STATS = gql`
  query UserWatchStats($userId: String!) {
    userWatchStats(userId: $userId) {
      totalWatch
      uniqueMovies
      averageRating
      totalWatchTime
      favoriteCount
      firstWatchDate
      lastWatchDate
      genreDistribution {
        genre
        count
        percentage
      }
      watchTypeDistribution {
        type
        count
        percentage
      }
    }
  }
`;

// Watch Streak Queries
export const GET_WATCH_STREAK = gql`
  query GetStreaks {
    currentWatchStreak
    longestWatchStreak
  }
`;
