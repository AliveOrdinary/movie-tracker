'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_POPULAR_MOVIES } from '@/types/graphql/movies';
import { MovieGridSkeleton } from '@/components/movies/MovieGridSkeleton';
import { MovieCard } from '@/components/movies/MovieCard';
import { WithErrorBoundary } from '@/components/ErrorBoundary';
import { TMDBMovie } from '@/types/movie';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw } from 'lucide-react';

export default function PopularMoviesPage() {
  const [movies, setMovies] = useState<TMDBMovie[]>([]);
  const router = useRouter();
  const { toast } = useToast();
  const [isRetrying, setIsRetrying] = useState(false);
  
  // Fallback movies in case API fails
  const FALLBACK_MOVIES = [
    {
      id: '550',
      tmdbId: 550,
      title: 'Fight Club',
      originalTitle: 'Fight Club',
      overview: 'A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy.',
      posterPath: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
      backdropPath: '/rr7E0NoGKxvbkb89eR1GwfoYjpA.jpg',
      voteAverage: 8.4,
      voteCount: 25000,
      releaseYear: 1999,
      genres: ['Drama', 'Thriller'],
      isAdult: false,
      languages: ['en'],
      isPopular: true
    },
    {
      id: '238',
      tmdbId: 238,
      title: 'The Godfather',
      originalTitle: 'The Godfather',
      overview: 'The aging patriarch of an organized crime dynasty transfers control to his reluctant son.',
      posterPath: '/3bhkrj58Vtu7enYsRolD1fZdja1.jpg',
      backdropPath: '/tmU7GeKVybMWFButWEGl2M4GeiP.jpg',
      voteAverage: 8.7,
      voteCount: 17000,
      releaseYear: 1972,
      genres: ['Drama', 'Crime'],
      isAdult: false,
      languages: ['en', 'it', 'la'],
      isPopular: true
    },
    {
      id: '155',
      tmdbId: 155,
      title: 'The Dark Knight',
      originalTitle: 'The Dark Knight',
      overview: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
      posterPath: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
      backdropPath: '/5QlSqu4J9KQHAhdTQb8gkTvuTMh.jpg',
      voteAverage: 8.5,
      voteCount: 28000,
      releaseYear: 2008,
      genres: ['Action', 'Crime', 'Drama', 'Thriller'],
      isAdult: false,
      languages: ['en'],
      isPopular: true
    },
    {
      id: '680',
      tmdbId: 680,
      title: 'Pulp Fiction',
      originalTitle: 'Pulp Fiction',
      overview: 'The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.',
      posterPath: '/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',
      backdropPath: '/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg',
      voteAverage: 8.5,
      voteCount: 24000,
      releaseYear: 1994,
      genres: ['Thriller', 'Crime'],
      isAdult: false,
      languages: ['en'],
      isPopular: true
    }
  ];
  
  const { loading, error, data, refetch } = useQuery(GET_POPULAR_MOVIES, {
    variables: { page: 1 },
    fetchPolicy: 'network-only',
    errorPolicy: 'all',
    onError: (error) => {
      console.error('Error fetching popular movies:', error);
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
    if (data?.popularMovies) {
      console.log("Received popularMovies data:", data.popularMovies);
      setMovies(data.popularMovies);
    } else if (error) {
      console.error("Error data:", error);
      // Show fallback movies
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
          <h1 className="text-3xl font-bold">Popular Movies</h1>
          <p className="text-muted-foreground">Discover the most popular movies right now</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription className="flex justify-between items-center">
              <span>Failed to load popular movies</span>
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
                key={`popular-${movie.id}`}
                movie={{
                  id: `popular-${movie.id}`,
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
