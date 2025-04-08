'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_NOW_PLAYING_MOVIES } from '@/types/graphql/movies';
import { MovieGridSkeleton } from '@/components/movies/MovieGridSkeleton';
import { MovieCard } from '@/components/movies/MovieCard';
import { WithErrorBoundary } from '@/components/ErrorBoundary';
import { TMDBMovie } from '@/types/movie';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw } from 'lucide-react';

export default function NowPlayingMoviesPage() {
  const [movies, setMovies] = useState<TMDBMovie[]>([]);
  const router = useRouter();
  const { toast } = useToast();
  const [isRetrying, setIsRetrying] = useState(false);
  
  // Fallback movies in case API fails
  const FALLBACK_MOVIES = [
    {
      id: '550',
      title: 'Fight Club',
      original_title: 'Fight Club',
      overview: 'A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy.',
      poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
      backdrop_path: '/rr7E0NoGKxvbkb89eR1GwfoYjpA.jpg',
      vote_average: 8.4,
      vote_count: 25000,
      release_date: '1999-10-15',
      genre_ids: [18, 53],
      adult: false,
      original_language: 'en',
      popularity: 28.5
    },
    {
      id: '238',
      title: 'The Godfather',
      original_title: 'The Godfather',
      overview: 'The aging patriarch of an organized crime dynasty transfers control to his reluctant son.',
      poster_path: '/3bhkrj58Vtu7enYsRolD1fZdja1.jpg',
      backdrop_path: '/tmU7GeKVybMWFButWEGl2M4GeiP.jpg',
      vote_average: 8.7,
      vote_count: 17000,
      release_date: '1972-03-14',
      genre_ids: [18, 80],
      adult: false,
      original_language: 'en',
      popularity: 25.1
    },
    {
      id: '155',
      title: 'The Dark Knight',
      original_title: 'The Dark Knight',
      overview: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
      poster_path: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
      backdrop_path: '/5QlSqu4J9KQHAhdTQb8gkTvuTMh.jpg',
      vote_average: 8.5,
      vote_count: 28000,
      release_date: '2008-07-18',
      genre_ids: [28, 80, 18, 53],
      adult: false,
      original_language: 'en',
      popularity: 30.2
    },
    {
      id: '680',
      title: 'Pulp Fiction',
      original_title: 'Pulp Fiction',
      overview: 'The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.',
      poster_path: '/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',
      backdrop_path: '/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg',
      vote_average: 8.5,
      vote_count: 24000,
      release_date: '1994-10-14',
      genre_ids: [53, 80],
      adult: false,
      original_language: 'en',
      popularity: 27.8
    }
  ];
  
  const { loading, error, data, refetch } = useQuery(GET_NOW_PLAYING_MOVIES, {
    variables: { page: 1 },
    fetchPolicy: 'network-only',
    errorPolicy: 'all',
    onError: (error) => {
      console.error('Error fetching now playing movies:', error);
      // Show fallback movies on error
      setMovies(FALLBACK_MOVIES);
      toast({
        variant: "destructive",
        title: "Failed to load movies",
        description: "Showing sample movie data instead"
      });
    }
  });

  useEffect(() => {
    if (data?.nowPlayingMovies) {
      console.log("Received nowPlayingMovies data:", data.nowPlayingMovies);
      setMovies(data.nowPlayingMovies);
    } else if (error) {
      console.error("Error data:", error);
      // Show fallback movies if not already set
      setMovies(FALLBACK_MOVIES);
    }
  }, [data, error]);

  const handleRetry = () => {
    setIsRetrying(true);
    refetch()
      .then(() => {
        setIsRetrying(false);
        toast({
          title: "Success",
          description: "Movies refreshed successfully"
        });
      })
      .catch((error) => {
        setIsRetrying(false);
        toast({
          variant: "destructive",
          title: "Refresh failed",
          description: error.message
        });
        // Show fallback movies on retry failure
        setMovies(FALLBACK_MOVIES);
      });
  };

  return (
    <WithErrorBoundary>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Now Playing</h1>
          <p className="text-muted-foreground">Movies currently in theaters</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription className="flex justify-between items-center">
              <span>Failed to load now playing movies</span>
              <Button 
                onClick={handleRetry} 
                size="sm" 
                variant="outline" 
                disabled={isRetrying}
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </>
                )}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <MovieGridSkeleton />
        ) : movies.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {movies.map((movie) => (
              <MovieCard
                key={`now-playing-${movie.id}`}
                movie={{
                  id: `now-playing-${movie.id}`,
                  tmdbId: parseInt(movie.id) || 0,
                  title: movie.title,
                  originalTitle: movie.original_title || movie.title,
                  overview: movie.overview,
                  releaseYear: movie.release_date ? new Date(movie.release_date).getFullYear() : 0,
                  posterPath: movie.poster_path,
                  backdropPath: movie.backdrop_path,
                  voteAverage: movie.vote_average || 0,
                  voteCount: movie.vote_count || 0,
                  genres: movie.genre_ids ? [] : [],
                  isAdult: movie.adult || false,
                  languages: [movie.original_language || 'en'],
                  popularity: movie.popularity || 0,
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No movies available at the moment</p>
            <Button 
              onClick={() => router.push('/movies')} 
              variant="outline" 
              className="mt-4"
            >
              Browse All Movies
            </Button>
          </div>
        )}
      </div>
    </WithErrorBoundary>
  );
}
