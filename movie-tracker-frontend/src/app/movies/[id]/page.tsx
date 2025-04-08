// src/app/movies/[id]/page.tsx
'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@apollo/client';
import { GET_MOVIE_DETAILS } from '@/types/graphql/movies';
import { MovieHero } from '@/components/movies/MovieHero';
import { MovieContent } from '@/components/movies/MovieContent';
import { MovieReviews } from '@/components/movies/MovieReviews';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { MovieSidebar } from '@/components/movies/MovieSidebar';
import { toast } from '@/hooks/use-toast';

export default function MovieDetailsPage() {
  const { id } = useParams();
  
  // Process the ID - it might be a string, so sanitize it
  const processId = (): number => {
    if (!id) return 0;
    
    // Convert to string if it's not already
    const idStr = String(id);
    
    // If the ID is from our MovieCard component pattern "movie-{tmdbId}-{index}"
    if (idStr.startsWith('movie-')) {
      // Extract the TMDB ID part (second segment after splitting by hyphen)
      const segments = idStr.split('-');
      if (segments.length >= 2) {
        return parseInt(segments[1], 10) || 0;
      }
    }
    
    // If the ID is a UUID or a prefixed ID like 'api-123' or 'tmdb-123'
    if (idStr.includes('-') || idStr.includes('_')) {
      // Extract the numeric part if it's a tmdb ID
      if (idStr.startsWith('tmdb-')) {
        const tmdbId = idStr.split('-')[1];
        return parseInt(tmdbId, 10) || 0;
      }
      
      // For API IDs, we need to extract just the number
      const match = idStr.match(/\d+/);
      if (match) {
        return parseInt(match[0], 10);
      }
    }
    
    // Otherwise, just try to parse it directly
    return parseInt(idStr, 10) || 0;
  };
  
  const tmdbId = processId();
  console.log(`Processing movie ID: ${id}, tmdbId for query: ${tmdbId}`);
  
  const { data, loading, error } = useQuery(GET_MOVIE_DETAILS, {
    variables: { tmdbId },
    fetchPolicy: 'network-only', // Force a network request instead of using cache
    errorPolicy: 'all',
    // Only run the query if we have a valid tmdbId
    skip: !tmdbId || tmdbId <= 0,
  });

  // If we don't have a valid TMDB ID, show an error before any loading state
  if (!tmdbId || tmdbId <= 0) {
    return (
      <div className="flex flex-col h-[50vh] items-center justify-center gap-4">
        <p className="text-destructive font-bold text-lg">Invalid Movie ID</p>
        <p className="text-muted-foreground">The movie ID provided is not valid.</p>
        <div className="bg-muted p-4 rounded max-w-lg">
          <p>Debug information:</p>
          <p>Raw ID: {id}</p>
          <p>Processed TMDB ID: {tmdbId}</p>
        </div>
        <button 
          onClick={() => window.location.href = '/movies'}
          className="bg-primary text-primary-foreground px-4 py-2 rounded mt-4"
        >
          Go back to movies
        </button>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
        <p className="ml-2 text-muted-foreground">Loading movie details...</p>
      </div>
    );
  }

  if (error) {
    console.error(`Error fetching movie details:`, error);
    
    return (
      <div className="flex flex-col h-[50vh] items-center justify-center gap-4">
        <p className="text-destructive font-bold text-lg">Error loading movie details</p>
        <p className="text-destructive">{error.message}</p>
        <div className="bg-muted p-4 rounded max-w-lg">
          <p>Debug information:</p>
          <p>Movie ID: {id}</p>
          <p>TMDB ID: {tmdbId}</p>
          <pre className="text-xs mt-2 overflow-auto max-h-40">
            {JSON.stringify(error, null, 2)}
          </pre>
        </div>
        <button 
          onClick={() => window.location.href = '/movies'}
          className="bg-primary text-primary-foreground px-4 py-2 rounded mt-4"
        >
          Go back to movies
        </button>
      </div>
    );
  }

  // Log what we received
  console.log('Movie data received:', data);
  const movie = data?.movie;

  if (!movie) {
    console.error('Movie not found in data object:', data);
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Movie not found</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      <MovieHero movie={movie} />
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <MovieContent movie={movie} />
            <MovieReviews movieId={movie.id} className="mt-8" />
          </div>
          <div>
            <MovieSidebar movie={movie} />
          </div>
        </div>
      </div>
    </main>
  );
}