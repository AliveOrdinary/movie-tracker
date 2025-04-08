'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { Search, SlidersHorizontal, WifiOff, AlertTriangle, RefreshCw } from 'lucide-react';
import { GET_NOW_PLAYING_MOVIES, SEARCH_MOVIES } from '@/types/graphql/movies';
import { TMDBMovie, Movie } from '@/types/movie';
import { MovieCard } from './MovieCard';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MovieGridSkeleton } from '@/components/movies/MovieGridSkeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth/AuthContext';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useConnectivity } from '@/components/providers/Providers';

type SortOption = 'popular' | 'rating' | 'newest';

interface MovieGridProps {
  initialMovies?: Movie[] | TMDBMovie[];
  showSearch?: boolean;
  showFilters?: boolean;
}

// Our fixed fallback movies with guaranteed unique IDs
const FALLBACK_MOVIES: Movie[] = [
  {
    id: 'fallback-550',
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
    popularity: 28.5
  },
  {
    id: 'fallback-238',
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
    popularity: 25.1
  },
  {
    id: 'fallback-155',
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
    popularity: 30.2
  },
  {
    id: 'fallback-680',
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
    popularity: 27.8
  }
];

// Genre map to convert IDs to names
const GENRE_MAP: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science Fiction",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western"
};

export function MovieGrid({ 
  initialMovies,
  showSearch = true, 
  showFilters = true 
}: MovieGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const { isOffline } = useConnectivity();
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  
  // Use empty array first, will be populated from API
  const [movies, setMovies] = useState<Movie[]>([]);
  const [useFallback, setUseFallback] = useState(false);

  // Query for now playing movies
  const { data: nowPlayingData, loading: nowPlayingLoading, error: nowPlayingError, refetch: refetchNowPlaying } = useQuery(GET_NOW_PLAYING_MOVIES, {
    variables: { page: 1 },
    skip: isSearching || useFallback,
    fetchPolicy: 'network-only',
    errorPolicy: 'all',
    notifyOnNetworkStatusChange: true,
  });

  // Query for searched movies
  const { data: searchData, loading: searchLoading, error: searchError, refetch: refetchSearch } = useQuery(SEARCH_MOVIES, {
    variables: { query: searchQuery, page: 1 },
    skip: !isSearching || !searchQuery || useFallback,
    fetchPolicy: 'network-only',
    errorPolicy: 'all',
    notifyOnNetworkStatusChange: true,
  });

  // Process movies when data changes
  useEffect(() => {
    // Skip if using fallback movies
    if (useFallback) return;
    
    // Process TMDBMovie arrays directly from API responses
    if ((isSearching && searchData?.searchMovies) || (!isSearching && nowPlayingData?.nowPlayingMovies)) {
      // Get the right data source
      const sourceData = isSearching ? searchData?.searchMovies : nowPlayingData?.nowPlayingMovies;
      
      // Safety check
      if (!Array.isArray(sourceData)) {
        console.error("Source data is not an array:", sourceData);
        setMovies(FALLBACK_MOVIES);
        return;
      }
      
      console.log(`Processing ${sourceData.length} movies from ${isSearching ? 'search' : 'now playing'} data`);
      
      // Debug the actual API response structure
      console.log('API Response Structure:', { 
        searchData, 
        nowPlayingData,
        sourceData
      });
      
      // Create a movie ID tracking set to ensure uniqueness
      const processedTmdbIds = new Set();
      const processedMovies: Movie[] = [];
      
      // Process each movie, ensuring no duplicates by tmdbId
      sourceData.forEach((movie: any, index: number) => {
        // Extract tmdbId correctly
        const tmdbId = parseInt(movie.id) || 0;
        
        // Skip if we've already processed this tmdbId
        if (processedTmdbIds.has(tmdbId)) {
          console.log(`Skipping duplicate movie with tmdbId: ${tmdbId}`);
          return;
        }
        
        // Add to tracking set
        processedTmdbIds.add(tmdbId);
        
        // Generate a unique ID that includes index for absolute uniqueness
        const stableId = `movie-${tmdbId}-${index}`;
        
        // Log processing details
        console.log(`Processing movie: ${movie.title}, tmdbId: ${tmdbId}, stableId: ${stableId}`);
        
        // Process movies from the API data format
        // Handle both the new camelCase and old snake_case formats for compatibility
        processedMovies.push({
          id: stableId,
          tmdbId: movie.tmdbId || tmdbId,
          title: movie.title || '',
          originalTitle: movie.originalTitle || movie.original_title || movie.title,
          overview: movie.overview || '',
          releaseYear: movie.releaseYear || (movie.release_date ? new Date(movie.release_date).getFullYear() : 0),
          posterPath: movie.posterPath || movie.poster_path,
          backdropPath: movie.backdropPath || movie.backdrop_path,
          voteAverage: movie.voteAverage || movie.vote_average || 0,
          voteCount: movie.voteCount || movie.vote_count || 0,
          genres: movie.genres || (movie.genre_ids ? movie.genre_ids.map((id: number) => GENRE_MAP[id] || 'Unknown') : []),
          isAdult: movie.isAdult || movie.adult || false,
          languages: movie.languages || [movie.original_language || 'en'],
          popularity: movie.popularity || 0,
          isInWatchlist: false,
          userRating: null,
          isPopular: movie.isPopular || (movie.popularity > 20)
        });
      });
      
      console.log(`Processed ${processedMovies.length} unique movies from source data of ${sourceData.length} items`);
      
      // Sort movies
      const sortedMovies = sortMovies(processedMovies, sortBy);
      
      // Update state
      setMovies(sortedMovies);
    } else if (nowPlayingError || searchError) {
      // If there was an error, use fallback
      console.warn("API error, using fallback movies");
      setMovies(FALLBACK_MOVIES);
      setUseFallback(true);
    }
  }, [nowPlayingData, searchData, isSearching, nowPlayingError, searchError, useFallback, sortBy]);

  // Function to sort movies
  const sortMovies = (moviesToSort: Movie[], sortOption: SortOption): Movie[] => {
    const sorted = [...moviesToSort];
    
    switch (sortOption) {
      case 'popular':
        sorted.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        break;
      case 'rating':
        sorted.sort((a, b) => (b.voteAverage || 0) - (a.voteAverage || 0));
        break;
      case 'newest':
        sorted.sort((a, b) => (b.releaseYear || 0) - (a.releaseYear || 0));
        break;
    }
    
    return sorted;
  };

  // Effect for sorting when sort option changes
  useEffect(() => {
    setMovies(sortMovies(movies, sortBy));
  }, [sortBy]);

  // Error handling
  useEffect(() => {
    if (nowPlayingError) {
      console.error('Now playing movies error:', nowPlayingError);
      setUseFallback(true);
    }
    
    if (searchError) {
      console.error('Search movies error:', searchError);
    }
  }, [nowPlayingError, searchError]);

  const loading = (isSearching ? searchLoading : nowPlayingLoading) || isRetrying;
  const error = isSearching ? searchError : nowPlayingError;
  const hasNetworkError = error?.networkError != null;

  // Toggle between API and fallback
  const toggleFallback = () => {
    setUseFallback(!useFallback);
    if (!useFallback) {
      setMovies(FALLBACK_MOVIES);
      toast({
        title: "Switched to Sample Movies",
        description: "Now showing sample movie data",
      });
    } else {
      toast({
        title: "Attempting to use API",
        description: "Trying to connect to the movie database...",
      });
      if (isSearching && searchQuery) {
        refetchSearch();
      } else {
        refetchNowPlaying();
      }
    }
  };

  // Retry function
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setIsRetrying(true);
    setUseFallback(false);
    
    if (isSearching && searchQuery) {
      refetchSearch()
        .then(() => {
          setIsRetrying(false);
          toast({
            title: "Connection restored",
            description: "Successfully connected to the server",
          });
        })
        .catch((error) => {
          console.error('Error during search refetch:', error);
          setIsRetrying(false);
          setUseFallback(true);
          toast({
            variant: "destructive",
            title: "Connection failed",
            description: "Couldn't connect to the server. Using fallback data.",
          });
        });
    } else {
      refetchNowPlaying()
        .then(() => {
          setIsRetrying(false);
          toast({
            title: "Connection restored",
            description: "Successfully connected to the server",
          });
        })
        .catch((error) => {
          console.error('Error during now playing refetch:', error);
          setIsRetrying(false);
          setUseFallback(true);
          toast({
            variant: "destructive",
            title: "Connection failed",
            description: "Couldn't connect to the server. Using fallback data.",
          });
        });
    }
    
    toast({
      title: "Retrying...",
      description: "Attempting to reconnect to the server",
    });
  };

  // Search handler
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearching(true);
    } else {
      setIsSearching(false);
    }
  };

  const handleAddToWatchlist = async (movieId: number) => {
    if (!isAuthenticated) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please sign in to add movies to your watchlist.",
      });
      return;
    }
    
    try {
      // TODO: Implement watchlist mutation
      toast({
        title: "Success",
        description: "Added to watchlist",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add to watchlist",
      });
    }
  };

  const handleSort = (option: SortOption) => {
    setSortBy(option);
  };

  const sortOptions = [
    { label: 'Popular', value: 'popular' },
    { label: 'Top Rated', value: 'rating' },
    { label: 'Newest', value: 'newest' },
  ];

  return (
    <ScrollArea className="h-full">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Now Playing Movies</h1>
          <p className="text-muted-foreground">Discover movies currently in theaters</p>
        </div>

        {isOffline && (
          <Alert variant="destructive" className="mb-4">
            <WifiOff className="h-4 w-4" />
            <AlertTitle>Offline Mode</AlertTitle>
            <AlertDescription>
              You are currently offline. Some features may be limited.
            </AlertDescription>
          </Alert>
        )}
        
        {!isOffline && hasNetworkError && (
          <Alert variant="warning" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Connection Issue</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>Unable to connect to the server. Showing fallback content.</span>
              <Button onClick={handleRetry} size="sm" variant="outline" disabled={isRetrying}>
                {isRetrying ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry Connection
                  </>
                )}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {useFallback && (
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Using Sample Movies</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>Showing sample movie data until API connection is working.</span>
              <Button onClick={toggleFallback} size="sm" variant="outline">
                {useFallback ? "Try API Again" : "Use Sample Movies"}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {(showSearch || showFilters) && (
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            {showSearch && (
              <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search movies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 max-w-xl w-full"
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading && isSearching ? 'Searching...' : 'Search'}
                </Button>
              </form>
            )}

            {showFilters && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Sort
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {sortOptions.map((option) => (
                    <DropdownMenuItem 
                      key={option.value}
                      onClick={() => handleSort(option.value as SortOption)}
                      className={sortBy === option.value ? 'bg-accent' : ''}
                    >
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}

        {loading && !hasNetworkError ? (
          <>
            <div className="text-center mb-4">
              <p className="text-muted-foreground">Loading movies from API...</p>
            </div>
            <MovieGridSkeleton />
          </>
        ) : movies.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {movies.map((movie) => (
                <MovieCard
                  key={movie.id} // Each movie has a guaranteed unique ID
                  movie={movie}
                  onAddToWatchlist={handleAddToWatchlist}
                />
              ))}
            </div>
            <p className="text-center text-xs text-muted-foreground mt-4">
              Showing {movies.length} movies
            </p>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {isSearching ? 'No movies found' : 'No movies available'}
            </p>
            {error && !hasNetworkError && (
              <p className="text-destructive mt-2">
                Error loading movies. Please try again.
              </p>
            )}
            <Button 
              onClick={toggleFallback} 
              variant="outline" 
              className="mt-4"
            >
              Show Sample Movies
            </Button>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
