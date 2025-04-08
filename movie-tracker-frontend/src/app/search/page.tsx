'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { SEARCH_MOVIES } from '@/types/graphql/movies';
import { useLazyQuery } from '@apollo/client';
import { Button } from '@/components/ui/button';
import { MovieCard } from '@/components/movies/MovieCard';
import { WithErrorBoundary } from '@/components/ErrorBoundary';
import { MovieGridSkeleton } from '@/components/movies/MovieGridSkeleton';
import { TMDBMovie } from '@/types/movie';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(query);
  const [movies, setMovies] = useState<TMDBMovie[]>([]);

  const [executeSearch, { loading, error, data }] = useLazyQuery(SEARCH_MOVIES, {
    fetchPolicy: 'network-only',
  });

  useEffect(() => {
    if (query) {
      executeSearch({ variables: { query, page: 1 } });
    }
  }, [query, executeSearch]);

  useEffect(() => {
    if (data?.searchMovies) {
      setMovies(data.searchMovies);
    }
  }, [data]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <WithErrorBoundary>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">Search Results</h1>
        
        <div className="mb-8">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search movies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full"
              />
            </div>
            <Button type="submit">Search</Button>
          </form>
        </div>

        {query ? (
          <p className="text-lg mb-6">
            Search results for: <span className="font-medium">"{query}"</span>
          </p>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Enter a search term to find movies</p>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load search results. Please try again.
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <MovieGridSkeleton />
        ) : movies.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {movies.map((movie) => (
              <MovieCard
                key={`search-${movie.id}`}
                movie={{
                  // Pass the movie data directly as it's already in the TMDBMovieOriginal format
                  // which the MovieCard component knows how to handle
                  ...movie,
                  // Convert ID strings to numbers where needed
                  id: movie.id,
                  // The MovieCard component will handle extracting release year from release_date
                  // and formatting genres from genre_ids
                }}
              />
            ))}
          </div>
        ) : query ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No movies found matching "{query}"</p>
            <Button 
              onClick={() => router.push('/movies')} 
              variant="outline" 
              className="mt-4"
            >
              Browse All Movies
            </Button>
          </div>
        ) : null}
      </div>
    </WithErrorBoundary>
  );
}
