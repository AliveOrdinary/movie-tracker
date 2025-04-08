/**
 * GraphQL operations for movie-related functionality
 * 
 * NOTE: As of March 2025, the backend API has been updated to return
 * TMDBMovie objects directly from various movie queries (searchMovies,
 * nowPlayingMovies, popularMovies, etc) instead of the previous
 * structure that contained page, totalPages, totalResults, and results fields.
 * 
 * When using these queries, note that:
 * 1. They now return arrays of TMDBMovie objects directly
 * 2. TMDBMovie uses snake_case fields (original_title, poster_path, etc.)
 * 3. You can check array length but there's no pagination info in the response
 * 
 * For pagination info, use the discoverMovies query which still returns
 * the PaginatedMovies structure.
 */

import { gql } from '@apollo/client';

// Fragments
export const TMDB_MOVIE_FRAGMENT = gql`
  fragment TMDBMovieDetails on TMDBMovie {
    id
    title
    original_title
    overview
    poster_path
    backdrop_path
    vote_average
    vote_count
    release_date
    genre_ids
    adult
    original_language
    popularity
  }
`;

export const MOVIE_DETAILS_FRAGMENT = gql`
  fragment MovieDetails on Movie {
    id
    tmdbId
    title
    originalTitle
    overview
    releaseYear
    posterPath
    backdropPath
    genres
    runtime
    languages
    isAdult
    reviews {
      id
      rating
      content
    }
  }
`;

// Queries and Mutations

// Additional movie queries to match backend schema
export const GET_TRENDING_MOVIES = gql`
  query TrendingMovies($page: Int = 1, $timeWindow: String = "week") {
    trendingMovies(page: $page, timeWindow: $timeWindow) {
      id
      tmdbId
      title
      originalTitle
      overview
      posterPath
      backdropPath
      voteAverage
      voteCount
      releaseYear
      genres
      isAdult
      languages
      isPopular
    }
  }
`;

export const GET_TOP_RATED_MOVIES = gql`
  query TopRatedMovies($page: Int = 1) {
    topRatedMovies(page: $page) {
      id
      title
      original_title
      overview
      poster_path
      backdrop_path
      vote_average
      vote_count
      release_date
      genre_ids
      adult
      original_language
      popularity
    }
  }
`;

export const GET_UPCOMING_MOVIES = gql`
  query UpcomingMovies($page: Int = 1) {
    upcomingMovies(page: $page) {
      id
      tmdbId
      title
      originalTitle
      overview
      posterPath
      backdropPath
      voteAverage
      voteCount
      releaseYear
      genres
      isAdult
      languages
      isPopular
    }
  }
`;

export const GET_RECOMMENDED_MOVIES = gql`
  query RecommendedMovies($tmdbId: Int!, $page: Int = 1) {
    recommendedMovies(tmdbId: $tmdbId, page: $page) {
      id
      tmdbId
      title
      originalTitle
      overview
      posterPath
      backdropPath
      voteAverage
      voteCount
      releaseYear
      genres
      isAdult
      languages
      isPopular
    }
  }
`;

export const GET_SIMILAR_MOVIES = gql`
  query SimilarMovies($tmdbId: Int!, $page: Int = 1) {
    similarMovies(tmdbId: $tmdbId, page: $page) {
      id
      tmdbId
      title
      originalTitle
      overview
      posterPath
      backdropPath
      voteAverage
      voteCount
      releaseYear
      genres
      isAdult
      languages
      isPopular
    }
  }
`;

export const GET_MOVIE_DETAILS = gql`
  query GetMovieDetails($tmdbId: Int!) {
    movie(tmdbId: $tmdbId) {
      id
      tmdbId
      title
      originalTitle
      overview
      releaseYear
      posterPath
      posterUrl
      backdropPath
      backdropUrl
      genres
      runtime
      languages
      isAdult
      voteAverage
      voteCount
      isPopular
    }
  }
`;

export const GET_POPULAR_MOVIES = gql`
  query PopularMovies($page: Int = 1, $limit: Int = 10) {
    popularMovies(page: $page, limit: $limit) {
      id
      tmdbId
      title
      originalTitle
      overview
      posterPath
      backdropPath
      voteAverage
      voteCount
      releaseYear
      genres
      isAdult
      languages
      isPopular
    }
  }
`;

export const GET_MOVIE_REVIEWS = gql`
  query GetMovieReviews($movieId: String!, $filters: MovieReviewFilters) {
    movieReviews(movieId: $movieId, filters: $filters) {
      id
      content
      rating
      createdAt
      helpfulVotes
      status
      containsSpoilers
      user {
        id
        username
        avatarUrl
      }
      reactionCount
      reactionStats {
        type
        count
      }
      userReaction
    }
  }
`;

export const CREATE_REVIEW = gql`
  mutation CreateReview($input: CreateReviewInput!) {
    createReview(input: $input) {
      id
      content
      rating
      createdAt
      helpfulVotes
      containsSpoilers
      user {
        id
        username
        avatarUrl
      }
      status
    }
  }
`;

export const GET_MOVIE_IMAGES = gql`
  query GetMovieImages($tmdbId: Int!) {
    movie(tmdbId: $tmdbId) {
      id
      posterPath
      backdropPath
    }
  }
`;

// Updated to match actual schema - using TMDBMovie fields
export const SEARCH_MOVIES = gql`
  query SearchMovies($query: String!, $page: Int = 1) {
    searchMovies(query: $query, page: $page) {
      id
      title
      original_title
      overview
      poster_path
      backdrop_path
      vote_average
      vote_count
      release_date
      genre_ids
      adult
      original_language
      popularity
    }
  }
`;

export const GET_MOVIE_GENRES = gql`
  query MovieGenres {
    movieGenres {
      id
      name
    }
  }
`;

export const GET_MOVIE_BY_GENRE = gql`
  query MoviesByGenre($genreId: Int!, $page: Int) {
    moviesByGenre(genreId: $genreId, page: $page) {
      page
      totalPages
      totalResults
      results {
        id
        tmdbId
        title
        originalTitle
        overview
        genres
        releaseYear
        posterPath
        backdropPath
        voteAverage
        voteCount
      }
    }
  }
`;

export const GET_NOW_PLAYING_MOVIES = gql`
  query NowPlayingMovies($page: Int) {
    nowPlayingMovies(page: $page) {
      id
      title 
      original_title
      overview
      poster_path
      backdrop_path
      vote_average
      vote_count
      release_date
      genre_ids
      adult
      original_language
      popularity
    }
  }
`;

// TypeScript interfaces
export interface PaginatedMoviesResponse {
  results: MovieData[];
  page: number;
  totalPages: number;
  totalResults: number;
}

export interface MovieData {
  id: string;
  tmdbId: number;
  title: string;
  originalTitle: string;
  overview: string;
  releaseYear: number;
  posterPath: string | null;
  backdropPath: string | null;
  genres: string[];
  runtime: number | null;
  languages: string[];
  isAdult: boolean;
  voteAverage?: number;
  voteCount?: number;
  popularity?: number;
  watchProviders?: {
    results: {
      [countryCode: string]: WatchProviderData;
    };
  };
  reviews?: {
    id: string;
    rating: number;
    content: string;
  }[];
}

export interface WatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

export interface WatchProviderData {
  link: string;
  rent?: WatchProvider[];
  buy?: WatchProvider[];
  flatrate?: WatchProvider[];
}