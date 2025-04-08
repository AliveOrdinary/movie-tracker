// src/types/movie.ts

export interface Movie {
  id: string;
  tmdbId: number;
  title: string;
  originalTitle: string;
  overview: string;
  releaseYear: number;
  posterPath: string | null;
  posterUrl: string | null;
  backdropPath: string | null;
  backdropUrl: string | null;
  voteAverage?: number;
  voteCount?: number;
  genres: string[];
  runtime?: number | null;
  languages: string[];
  isAdult: boolean;
  popularity?: number;
  isInWatchlist?: boolean;
  userRating?: number;
  isPopular?: boolean;
  reviews?: {
    id: string;
    rating: number;
    content: string;
  }[];
}

// Original TMDB API format (snake_case)
export interface TMDBMovieOriginal {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  release_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  adult: boolean;
  original_language: string;
  popularity: number;
}

// Our backend GraphQL format (camelCase)
export interface TMDBMovie {
  id: string;
  tmdbId?: number;
  title: string;
  originalTitle: string;
  overview: string;
  releaseYear: number;
  posterPath: string | null;
  backdropPath: string | null;
  voteAverage: number;
  voteCount: number;
  genres: string[];
  isAdult: boolean;
  languages: string[];
  isPopular: boolean;
}

export interface MovieWatchProviders {
  id: number;
  results: {
    [countryCode: string]: {
      link: string;
      rent?: {
        provider_id: number;
        provider_name: string;
        logo_path: string;
      }[];
      buy?: {
        provider_id: number;
        provider_name: string;
        logo_path: string;
      }[];
      flatrate?: {
        provider_id: number;
        provider_name: string;
        logo_path: string;
      }[];
    };
  };
}

export interface MovieCredits {
  cast: {
    id: number;
    name: string;
    character: string;
    profile_path: string | null;
    order: number;
  }[];
  crew: {
    id: number;
    name: string;
    job: string;
    department: string;
    profile_path: string | null;
  }[];
}

export interface MovieVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
}
