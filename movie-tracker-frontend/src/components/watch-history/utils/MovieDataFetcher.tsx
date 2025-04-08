'use client';

import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import { Movie } from '@/types/movie';
import { ReactNode } from 'react';

// Query for a single movie
const GET_MOVIE = gql`
  query GetMovie($tmdbId: Int!) {
    movie(tmdbId: $tmdbId) {
      id
      tmdbId
      title
      originalTitle
      posterPath
      backdropPath
      releaseYear
      genres
      voteAverage
      voteCount
      overview
      runtime
    }
  }
`;

interface MovieDataFetcherProps {
  movieId: string;
  children: (movie: Movie | null, loading: boolean, error: any) => ReactNode;
}

export function MovieDataFetcher({ movieId, children }: MovieDataFetcherProps) {
  // Convert the movieId to a number - TMDB IDs are numbers
  const tmdbId = parseInt(movieId, 10);
  
  const { data, loading, error } = useQuery(GET_MOVIE, {
    variables: { tmdbId },
    skip: !tmdbId || isNaN(tmdbId),
  });

  return <>{children(data?.movie || null, loading, error)}</>;
}
