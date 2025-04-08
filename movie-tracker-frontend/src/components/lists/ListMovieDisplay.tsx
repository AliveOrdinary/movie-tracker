'use client';

import { useState, useEffect } from 'react';
import { normalizeMovieId, normalizeTmdbId } from '@/lib/utils/movie-utils';
import { useQuery, useLazyQuery } from '@apollo/client';
import { useToast } from '@/hooks/use-toast';
import { gql } from '@apollo/client';
import { ListItem } from '@/types/graphql/lists';
import { Movie } from '@/types/movie';
import { MovieCard } from '../movies/MovieCard';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';

import { GET_LIST_ITEMS } from '@/types/graphql/lists';
import { GET_MOVIE_DETAILS } from '@/types/graphql/movies';

interface ListMovieDisplayProps {
  listId: string;
}

export function ListMovieDisplay({ listId }: ListMovieDisplayProps) {
  const { toast } = useToast();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isRetrying, setIsRetrying] = useState(false);
  const [loadingMovies, setLoadingMovies] = useState(false);
  const [debug, setDebug] = useState<string[]>([]);

  // Function to create a mock movie when real data isn't available
  const createMockMovie = (tmdbId: number): Movie => {
    // Use the actual TMDB ID rather than hardcoded values
    // We'll use TMDB API format to make it clear this is a temporary placeholder
    return {
      id: `mock-movie-${tmdbId}`,
      tmdbId: tmdbId,
      title: `Movie ID: ${tmdbId}`,
      originalTitle: `TMDB ID: ${tmdbId}`,
      overview: "Fetching movie data failed - this is a placeholder. Please refresh to try again.",
      releaseYear: new Date().getFullYear(),
      posterPath: null,
      backdropPath: null,
      genres: ["Unknown"],
      languages: ["en"],
      isAdult: false,
      voteAverage: 0,
      voteCount: 0
    };
  };

  // Add debug logs
  const addDebugLog = (message: string) => {
    // Add timestamp to log messages
    const timestamp = new Date().toLocaleTimeString();
    const fullMessage = `[${timestamp}] ${message}`;
    console.log(fullMessage);
    setDebug(prev => [...prev, fullMessage]);
  };

  // Query to get movie details
  const [getMovieDetails, { loading: detailsLoading, error: detailsError }] = useLazyQuery(GET_MOVIE_DETAILS, {
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
    errorPolicy: 'all',
    onError: (error) => {
      addDebugLog(`Movie details error: ${error.message}`);
    }
  });

  const { data, loading, error, refetch } = useQuery(GET_LIST_ITEMS, {
    variables: { listId },
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
    errorPolicy: 'all',
    onCompleted: (data) => {
      addDebugLog(`List items completed: ${JSON.stringify(data)}`);
    },
    onError: (error) => {
      addDebugLog(`Error fetching list movies: ${error.message}`);
      toast({
        variant: "destructive",
        title: "Failed to load list movies",
        description: error.message
      });
    }
  });

  // Function to load movie details for a specific TMDB ID with retry logic
  const fetchMovieDetails = async (tmdbId: number) => {
    if (!tmdbId || isNaN(tmdbId) || tmdbId <= 0) {
      addDebugLog(`Invalid TMDB ID: ${tmdbId}`);
      return null;
    }

    // Setup retry mechanism
    const maxRetries = 2;
    let retries = 0;
    let lastError = null;

    addDebugLog(`===== STARTING FETCH FOR MOVIE ID: ${tmdbId} =====`);

    while (retries <= maxRetries) {
      try {
        addDebugLog(`Fetching details for movie with TMDB ID: ${tmdbId}${retries > 0 ? ` (retry ${retries})` : ''}`);
        
        // Ensure the ID is a safe integer to prevent any precision issues
        const tmdbIdBigInt = BigInt(String(tmdbId));
        
        // BigInt can't be directly sent to GraphQL, so convert it to a number
        // This is safe for TMDB IDs which should all be within Number.MAX_SAFE_INTEGER
        let tmdbIdNumber: number;
        
        if (tmdbIdBigInt <= BigInt(Number.MAX_SAFE_INTEGER)) {
          tmdbIdNumber = Number(tmdbIdBigInt);
        } else {
          // In the unlikely case it's too large, we'll need to handle it differently
          addDebugLog(`TMDB ID is extremely large (${tmdbId}), potential precision issues`); 
          tmdbIdNumber = Number(tmdbIdBigInt); // This might lose precision but it's our best option
        }
        
        if (isNaN(tmdbIdNumber)) {
          throw new Error(`Invalid TMDB ID format: ${tmdbId} (converted to ${tmdbIdNumber})`);
        }

        addDebugLog(`Using validated TMDB ID: ${tmdbIdNumber} (type: ${typeof tmdbIdNumber})`);
        
        // Use a direct client operation with a unique request ID to prevent cache issues
        const result = await getMovieDetails({ 
          variables: { tmdbId: tmdbIdNumber },
          fetchPolicy: 'network-only',  // Always go to network
          context: {
            queryDeduplication: false,   // Don't deduplicate this query
            clientName: `movie-fetch-${tmdbIdNumber}-${retries}`  // Unique client name
          }
        });

        addDebugLog(`Got result for ${tmdbIdNumber}: ${result ? 'success' : 'failed'}`);
        addDebugLog(`Response data: ${JSON.stringify(result?.data || 'no data').slice(0, 150)}...`);
        
        // Check if we got data back
        if (result.data?.movie) {
          addDebugLog(`Found movie data for ID ${tmdbIdNumber}: ${result.data.movie.title}`);
          // Log the full movie object to debug
          console.log(`Full movie data for ${tmdbIdNumber}:`, result.data.movie);
          return result.data.movie;
        }
        
        // If no data, increment retry counter
        addDebugLog(`No movie data found for ID ${tmdbIdNumber}, retry ${retries}/${maxRetries}`);
        retries++;
        await new Promise(resolve => setTimeout(resolve, 500));  // Wait 500ms before retry
      } catch (error) {
        lastError = error;
        addDebugLog(`Error fetching movie ${tmdbId}, retry ${retries}/${maxRetries}: ${error instanceof Error ? error.message : String(error)}`);
        console.error('Fetch error details:', error); // More detailed error logging
        retries++;
        await new Promise(resolve => setTimeout(resolve, 500));  // Wait 500ms before retry
      }
    }
    
    // If all retries failed, use a mock movie so we can at least see something
    addDebugLog(`All retries failed for movie ${tmdbId}, using mock data`);
    return createMockMovie(tmdbId);
  };

  // Process list items into movie objects
  useEffect(() => {
    const loadMovies = async () => {
      if (data?.listItems && data.listItems.length > 0) {
        addDebugLog(`List items loaded: ${data.listItems.length}`);
        
        // Log the actual structure of list items
        try {
          addDebugLog(`First list item: ${JSON.stringify(data.listItems[0])}`);
        } catch (e) {
          addDebugLog(`Error stringifying list item: ${e}`);
        }
        
        setLoadingMovies(true);
        
        // No longer setting placeholder movies to avoid the flash of fake data
        addDebugLog(`Found ${data.listItems.length} movies in the list, fetching details...`);
        
        try {
          // Then try to fetch real movie data for each item
          addDebugLog('Starting to fetch actual movie details...');
          let processedCount = 0;
          const tmdbIds = new Set(); // Use a Set to prevent duplicate fetches
          
          // First pass: collect all unique TMDB IDs to prevent duplicate fetches
          addDebugLog('=============================================');
          addDebugLog(`Starting movie processing for list with ID: ${listId}`);
          addDebugLog(`List contains ${data.listItems.length} items - collecting movie IDs:`);

          // Debug: Print all list items for inspection
          data.listItems.forEach((item, index) => {
            addDebugLog(`Item ${index+1}: movieId=${item.movieId} (type: ${typeof item.movieId}), id=${item.id}, order=${item.order}`);
            // Extra debug to check for any unexpected ID transformations
            if (typeof item.movieId === 'number' && item.movieId !== parseInt(String(item.movieId), 10)) {
              addDebugLog(`WARNING: Possible ID corruption - movieId ${item.movieId} doesn't match its parsed value ${parseInt(String(item.movieId), 10)}!`);
            }
          });

          for (const item of data.listItems) {
            // Each list item has a movie relationship with the movie entity
            // If the item.movie property is available, use that directly
            if (item.movie) {
            // The movie property contains the actual Movie entity with tmdbId
            addDebugLog(`List item has movie object: ${JSON.stringify(item.movie).slice(0, 150)}...`);
            
            // Use the tmdbId from the movie object (most reliable)
            if (item.movie.tmdbId && typeof item.movie.tmdbId === 'number' && item.movie.tmdbId > 0) {
            addDebugLog(`Using movie.tmdbId=${item.movie.tmdbId} from item ${item.id}`);
            tmdbIds.add(item.movie.tmdbId);
            continue;
            }
            }
            
            // If not available, we need to work with tmdbId directly
            if (item.tmdbId) {
            try {
            // Important: item.tmdbId is a TMDB ID, not an internal UUID
            const movieId = normalizeTmdbId(item.tmdbId);
            
            addDebugLog(`Using tmdbId=${movieId} from item ${item.id}`);
            
            if (movieId > 0) {
              tmdbIds.add(movieId);
            } else {
              addDebugLog(`Skipped invalid tmdbId: ${item.tmdbId}`);
            }
            } catch (error) {
            addDebugLog(`Error processing tmdbId ${item.tmdbId}: ${error}`);
            }
            } else {
            addDebugLog(`No movie or tmdbId found for item ${item.id}`);
            }
          }
          
          // Now fetch each unique TMDB ID - in series to avoid overloading the API
          const serialMoviePromises: Promise<void>[] = [];
          const fetchedMoviesArray: any[] = [];
          
          // Convert Set to Array and sort for consistent processing order
          const sortedTmdbIds = Array.from(tmdbIds).sort((a, b) => Number(a) - Number(b));
          
          for (const movieId of sortedTmdbIds) {
            processedCount++;
            addDebugLog(`Processing item ${processedCount}/${tmdbIds.size} with movieId: ${movieId} (${typeof movieId})`);
            
            // Create a promise that will fetch one movie and add it to our array
            const moviePromise = async () => {
              try {
                // Extra validation to ensure we have a valid movie ID
                const numericId = Number(movieId);
                if (isNaN(numericId) || numericId <= 0) {
                  addDebugLog(`Skipping invalid movieId: ${movieId} (converted to ${numericId})`);
                  return;
                }
                
                const movieData = await fetchMovieDetails(numericId);
                if (movieData) {
                  addDebugLog(`Successfully fetched movie data for ID ${numericId}: ${movieData.title}`);
                  fetchedMoviesArray.push(movieData);
                } else {
                  addDebugLog(`No movie data returned for ID ${numericId}`);
                }
              } catch (error) {
                addDebugLog(`Error in movie promise for ID ${movieId}: ${error}`);
              }
              // Small delay to prevent overwhelming the API
              await new Promise(resolve => setTimeout(resolve, 100));
            };
            
            // Add this promise to our list
            serialMoviePromises.push(moviePromise());
          }
          
          // Wait for all fetch operations to complete
          await Promise.all(serialMoviePromises);
          addDebugLog(`Fetched ${fetchedMoviesArray.length} movies serially`);
          
          // Log the results of our serial fetching
          addDebugLog(`Serial fetching completed for ${serialMoviePromises.length} movies`);
          
          // We already have all the movie data in fetchedMoviesArray
          const validMovies = fetchedMoviesArray as Movie[];
          addDebugLog(`Valid movies count: ${validMovies.length} out of ${tmdbIds.size} requested`);
          
          if (validMovies.length > 0) {
            addDebugLog(`Setting ${validMovies.length} valid movies to state`);
            
            // Add logging for the first valid movie to help with debugging
            if (validMovies[0]) {
              addDebugLog(`Example valid movie: ID=${validMovies[0].id}, tmdbId=${validMovies[0].tmdbId}, title=${validMovies[0].title}`);
            }
            
            // Map the list items to their corresponding movie details to maintain order
            const moviesMap = new Map(validMovies.map(movie => [movie.tmdbId, movie]));
            
            // Create a new array where we match list items to the fetched movie data
            const orderedMovies: Movie[] = [];
            
            // Use the original list items order to create our final movies array
            for (const item of data.listItems) {
              // Use our consistent normalization utility
              const movieId = normalizeTmdbId(item.movieId);
              
              addDebugLog(`Looking for movie with ID ${movieId} in fetched movies (raw: ${item.movieId})`);
              
              if (!isNaN(movieId) && movieId > 0) {
                const movie = moviesMap.get(movieId);
                if (movie) {
                  addDebugLog(`Found movie ${movie.title} for ID ${movieId}`);
                  orderedMovies.push(movie);
                } else {
                  addDebugLog(`No movie found for ID ${movieId}`);
                }
              }
            }
            
            // If we have ordered movies with data, use that
            if (orderedMovies.length > 0) {
              addDebugLog(`Final ordered movies count: ${orderedMovies.length}`);
              setMovies(orderedMovies);
            } else {
              // Fallback to the unordered list if something went wrong
              setMovies(validMovies);
            }
          } else {
            addDebugLog('No valid movies were fetched');
            setMovies([]);
          }
        } catch (error) {
          addDebugLog(`Error in loadMovies: ${error instanceof Error ? error.message : String(error)}`);
          setMovies([]);
        } finally {
          setLoadingMovies(false);
        }
      } else {
        addDebugLog(`No list items loaded or empty list. Data: ${JSON.stringify(data)}`);
        setMovies([]);
      }
    };
    
    loadMovies();
  }, [data]);

  const handleRetry = () => {
    setIsRetrying(true);
    // Clear debug logs on retry
    setDebug([]);
    addDebugLog('Retrying list items fetch...');
    
    refetch()
      .then(() => {
        setIsRetrying(false);
        addDebugLog('List items refetched successfully');
        toast({
          title: "Success",
          description: "Movie list refreshed successfully"
        });
      })
      .catch((error) => {
        setIsRetrying(false);
        addDebugLog(`Refetch error: ${error.message}`);
        toast({
          variant: "destructive",
          title: "Refresh failed",
          description: error.message
        });
      });
  };

  if (loading || loadingMovies) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" />
        <p className="ml-3">Loading list items...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>Failed to load list movies: {error.message}</span>
          <Button onClick={handleRetry} size="sm" variant="outline" disabled={isRetrying}>
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
    );
  }

  return (
    <div className="mt-6">
      <h2 className="text-xl font-bold mb-4">Movies in this list</h2>

      {/* This helps diagnose the ID mismatch issue */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-md mb-4">
          <h3 className="text-sm font-bold mb-2 text-blue-800 dark:text-blue-300">Watchlist ID Debug</h3>
          <p className="text-xs text-blue-700 dark:text-blue-400 mb-2">
            This debug panel shows movie IDs in your watchlist to diagnose ID mapping issues.
          </p>
          <div className="text-xs mt-2">
            <strong>List ID:</strong> {listId}
          </div>
          <div className="text-xs mt-1">
            <strong>Raw Movie IDs in this list:</strong> {data?.listItems?.map(item => 
              <span key={item.id} className="inline-block bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded mr-2 mb-1">
                {item.movieId} <small>(type: {typeof item.movieId})</small>
              </span>
            )}
          </div>
        </div>
      )}

      {/* No movies found state */}
      {!movies || movies.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No movies found in this list.</p>
          <p className="text-muted-foreground text-sm mt-2">Add some movies to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {/* Check if any movies are mock movies and display a warning */}
          {movies.some(m => m.id.startsWith('mock-movie-')) && (
            <div className="col-span-full mb-4">
              <Alert variant="warning" className="bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertTitle>Some movie data failed to load</AlertTitle>
                <AlertDescription>
                  We couldn't retrieve all movie details from our database. Placeholder data is shown instead.
                  <Button 
                    onClick={handleRetry} 
                    size="sm" 
                    variant="outline" 
                    className="mt-2"
                    disabled={isRetrying}
                  >
                    {isRetrying ? 'Retrying...' : 'Retry Loading Data'}
                  </Button>
                </AlertDescription>
              </Alert>
            </div>
          )}
          
          {movies.map((movie) => (
            <MovieCard 
              key={movie.id || movie.tmdbId}
              movie={movie}
            />
          ))}
        </div>
      )}
      
      {/* Debug logs - only visible in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-slate-100 dark:bg-slate-800 rounded-md">
          <h3 className="text-sm font-bold mb-2">Debug Logs</h3>
          <Button onClick={() => setDebug([])} size="sm" variant="outline" className="mb-2">Clear Logs</Button>
          <div className="text-xs font-mono overflow-auto max-h-60 bg-black text-white p-3 rounded">
            {debug.map((log, i) => (
              <div key={i}>[{i}] {log}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}