// src/types/graphql/movies.ts
import { gql } from '@apollo/client';

export const MOVIE_FRAGMENT = gql`
  fragment MovieFields on TMDBMovie {
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
  }
`;

export const GET_POPULAR_MOVIES = gql`
  query PopularMovies($page: Int) {
    popularMovies(page: $page) {
      ...MovieFields
    }
  }
  ${MOVIE_FRAGMENT}
`;

export const SEARCH_MOVIES = gql`
  query SearchMovies($query: String!, $page: Int) {
    searchMovies(query: $query, page: $page) {
      ...MovieFields
    }
  }
  ${MOVIE_FRAGMENT}
`;

export const GET_MOVIE_DETAILS = gql`
  query GetMovie($tmdbId: Int!) {
    movie(tmdbId: $tmdbId) {
      id
      tmdbId
      title
      originalTitle
      overview
      posterPath
      backdropPath
      releaseYear
      genres
      runtime
      languages
      isAdult
    }
  }
`;