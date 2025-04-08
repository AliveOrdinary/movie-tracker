import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation } from '@apollo/client';
import { useLists } from '@/lib/lists/ListsContext';
import { 
  GET_MOVIE_WATCH_HISTORY, 
  TOGGLE_FAVORITE_WATCH
} from '@/components/watch-history/watch-history-operations';
import { ListType, ListPrivacy } from '@/types/graphql/lists';
import { WatchType } from '@/types/generated/graphql';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { formatMovieIdForApi, getMovieInternalId, normalizeTmdbId } from '@/lib/utils/movie-utils';
import { auth } from '@/lib/firebase/config';
import { PostWatchReviewPrompt } from '@/components/reviews/PostWatchReviewPrompt';

export type MovieStatusType = 'unwatched' | 'watchlist' | 'watched';

/**
 * Custom hook for tracking and managing a movie's status
 * This centralizes logic around watchlist and watch history
 */
export function useMovieStatus(movieId: string) {
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  
  // Get lists context for watchlist operations
  const { 
    myLists, 
    bulkAddMovies, 
    bulkRemoveMovies, 
    createList, 
    loading,
    refetchMyLists 
  } = useLists();
  
  // Try to find the standard watchlist
  const watchlist = useMemo(() => {
    if (!myLists || myLists.length === 0) {
      console.log('No lists available yet');
      return null;
    }

    console.log(`Looking for Watchlist among ${myLists.length} lists:`, 
      myLists.map(l => ({ id: l.id, name: l.name, type: l.type })));

    // First look for an exact match with STANDARD type
    let standardWatchlist = myLists.find(list => 
      list.type.toUpperCase() === ListType.STANDARD.toUpperCase() && 
      list.name === 'Watchlist'
    );
    
    if (standardWatchlist) {
      console.log(`Found standard watchlist: ${standardWatchlist.id}`);
      return standardWatchlist;
    }
    
    // If not found, check for any case-insensitive match with Watchlist name
    const namedWatchlist = myLists.find(list => 
      list.name.toLowerCase() === 'watchlist'
    );
    
    if (namedWatchlist) {
      console.log(`Found watchlist by name only: ${namedWatchlist.id}`);
      return namedWatchlist;
    }
    
    console.log('No watchlist found');
    return null;
  }, [myLists]);
  
  // Check if the movie is in the watchlist
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [watchlistItemId, setWatchlistItemId] = useState<string | null>(null);
  const [internalMovieId, setInternalMovieId] = useState<string | null>(null);
  const [isLoadingInternalId, setIsLoadingInternalId] = useState(false);
  
  // States for post-watch review prompt
  const [showReviewPrompt, setShowReviewPrompt] = useState(false);
  const [lastLoggedWatchId, setLastLoggedWatchId] = useState<string | null>(null);
  const [movieTitle, setMovieTitle] = useState<string>('');
  const [lastWatchRating, setLastWatchRating] = useState<number | undefined>(undefined);
  
  // Effect to fetch internal movie ID on mount
  useEffect(() => {
    if (!movieId || !isAuthenticated) return;

    async function fetchInternalId() {
      setIsLoadingInternalId(true);
      try {
        // First check if we're already using a UUID - if so, we can use it directly
        if (movieId.includes('-') && 
            movieId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          setInternalMovieId(movieId);
          return;
        }
        
        // Extract numeric TMDB ID to ensure we're using the right ID format
        // Some movie IDs might come in different formats, so we'll normalize
        let tmdbId: number | null = null;
        
        // Try to parse the number from the string
        const numericMatch = String(movieId).match(/\d+/);
        if (numericMatch && numericMatch[0]) {
          tmdbId = parseInt(numericMatch[0], 10);
        }
        
        // If we got a valid TMDB ID, use it to fetch internal ID
        if (tmdbId && !isNaN(tmdbId)) {
          console.log(`Using normalized TMDB ID: ${tmdbId} (from ${movieId})`);
          const id = await getMovieInternalId(tmdbId);
          if (id) {
            console.log(`Found internal ID ${id} for TMDB ID ${tmdbId}`);
            setInternalMovieId(id);
          } else {
            console.warn(`Could not find internal ID for TMDB ID ${tmdbId}`);
          }
        } else {
          console.warn(`Invalid movie ID format: ${movieId}, failed to extract TMDB ID`);
        }
      } catch (error) {
        console.error('Error fetching internal movie ID:', error);
      } finally {
        setIsLoadingInternalId(false);
      }
    }
    
    fetchInternalId();
  }, [movieId, isAuthenticated]);
  
  // Get watch history data for this movie with improved error handling
  const { data: watchHistoryData, loading: watchHistoryLoading, refetch: refetchWatchHistory } = useQuery(GET_MOVIE_WATCH_HISTORY, {
    variables: { movieId: internalMovieId },
    skip: !internalMovieId || !isAuthenticated || isLoadingInternalId,
    fetchPolicy: 'cache-and-network',
    // Prevent cache writing errors from breaking the UI
    errorPolicy: 'all',
    // Used to customize the cache update behavior
    onCompleted: (data) => {
      if (!data || !data.movieWatchHistory) {
        console.warn('No movie watch history data available');
      }
    },
    onError: (error) => {
      console.error(`Error fetching movie watch history for ID ${internalMovieId} (original: ${movieId}):`, error.message);
    }
  });
  
  // Favorite toggle mutation
  const [toggleFavoriteMutation] = useMutation(TOGGLE_FAVORITE_WATCH);
  
  // Process watch history data - with safer access
  const watchHistory = useMemo(() => {
    // Check if the field exists at all to avoid cache write errors
    if (!watchHistoryData || !('movieWatchHistory' in watchHistoryData)) {
      console.warn('movieWatchHistory field missing in response');
      return [];
    }
    return watchHistoryData.movieWatchHistory || [];
  }, [watchHistoryData]);
  
  const hasWatched = watchHistory.length > 0;
  const lastWatchDate = hasWatched && watchHistory[0]?.watchedAt ? new Date(watchHistory[0].watchedAt) : null;
  const mostRecentWatch = hasWatched ? watchHistory[0] : null;
  const isFavorite = mostRecentWatch?.isFavorite || false;
  
  // Effect to check watchlist status
  useEffect(() => {
    if (!watchlist || !watchlist.items || !movieId) {
      setIsInWatchlist(false);
      setWatchlistItemId(null);
      return;
    }
    
    // Check if movie is in watchlist
    const movieInWatchlist = watchlist.items.find(
      item => String(item.movieId) === String(movieId)
    );
    
    setIsInWatchlist(!!movieInWatchlist);
    setWatchlistItemId(movieInWatchlist?.id || null);
  }, [watchlist, movieId]);
  
  /**
   * Add movie to watchlist
   */
  const addToWatchlist = useCallback(async () => {
    console.log('addToWatchlist called for movie ID:', movieId);
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to add to your watchlist",
        variant: "destructive"
      });
      return;
    }
    
    // Use our consistent normalization utility
    let numericMovieId: number;
    
    try {
      // Normalize the movie ID to ensure we're using the correct TMDB ID format
      numericMovieId = normalizeTmdbId(movieId);
      
      if (!numericMovieId || isNaN(numericMovieId)) {
        throw new Error(`Could not extract valid numeric ID from ${movieId}`);
      }
      
      console.log(`Normalized movie ID: ${movieId} → ${numericMovieId}`);
      
      
      // Verify it's a valid ID and not something excessively large
      if (isNaN(numericMovieId) || numericMovieId > 2147483647) { // Max 32-bit integer
        throw new Error('Invalid movie ID format');
      }
    } catch (error) {
      console.error('Invalid movie ID format:', movieId);
      toast({
        title: "Error",
        description: "Invalid movie ID format",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // First, check for cached watchlist ID
      const cachedWatchlistId = localStorage.getItem('watchlist_list_id');
      if (cachedWatchlistId) {
      console.log(`Found cached watchlist ID: ${cachedWatchlistId}, attempting to use it first`);
      try {
        const result = await bulkAddMovies(cachedWatchlistId, [numericMovieId]);
        console.log('Successfully added movie to cached watchlist');
        setIsInWatchlist(true);
        return; // Exit early since we successfully used the cached list
      } catch (cachedError) {
      console.warn(`Error using cached watchlist ID: ${cachedError.message}, will try alternatives`);
      // Continue if there was an error with the cached ID
      }
      }
      
      // Check if user already has a watchlist - if so, refetch again
      if (!watchlist) {
      // Try refetching lists first to ensure we have the latest data
      console.log('No watchlist found initially, refetching lists...');
      await refetchMyLists();
      
      // After refetch, check all lists very carefully for any that might be a watchlist
      // First, check for any existing lists that might be a watchlist - both by type and by name
      for (const list of myLists) {
      console.log(`Checking list: ${list.id}, name: ${list.name}, type: ${list.type}`);
      if ((list.type && list.type.toUpperCase() === ListType.STANDARD.toUpperCase() && 
         list.name === 'Watchlist') || 
            (list.name && list.name.toLowerCase() === 'watchlist')) {
          
          console.log(`Using existing list with ID ${list.id} as watchlist`);
          
          // Update cache for future use
          localStorage.setItem('watchlist_list_id', list.id);
          
          try {
            // Use the existing list
            const result = await bulkAddMovies(list.id, [numericMovieId]);
            if (!result) {
              console.warn('No result returned from bulkAddMovies, but operation may have succeeded');
            }
            return; // Exit early since we found and used a list
          } catch (addError) {
            console.error('Error adding to existing list:', addError);
            // Continue to try creating a new list as fallback
          }
          }
        }
        
        // No usable watchlist found - try to create a new one
        try {
          console.log('Creating new watchlist with correct type STANDARD');
          
          // Explicitly use uppercase string to avoid enum case issues
          const newWatchlist = await createList({
            name: "Watchlist",
            type: "STANDARD" as ListType,  // Force the correct type
            description: "Movies I want to watch",
            category: "to_watch_movies",
            privacy: "PUBLIC" as ListPrivacy  // Force PUBLIC privacy for watchlist
          });
          
          console.log('Successfully created watchlist with ID:', newWatchlist.id);
          
          // Cache this ID for future use
          localStorage.setItem('watchlist_list_id', newWatchlist.id);
          
          const addResult = await bulkAddMovies(newWatchlist.id, [numericMovieId]);
          if (!addResult) {
            console.warn('No result returned from bulkAddMovies, but operation may have succeeded');
          }
        } catch (error) {
          console.error('Error creating watchlist:', error);
          
          // One more refetch to be sure we didn't miss anything
          await refetchMyLists();
          
          // Final check for any watchlist
          const anyPossibleWatchlist = myLists.find(list => 
            list.name.toLowerCase().includes('watch') ||
            (list.type && list.type.toUpperCase() === 'STANDARD')
          );
          
          if (anyPossibleWatchlist) {
            console.log(`Using fallback list ${anyPossibleWatchlist.id} as watchlist`);
            try {
              const finalResult = await bulkAddMovies(anyPossibleWatchlist.id, [numericMovieId]);
              if (!finalResult) {
                console.warn('No result returned from final bulkAddMovies attempt, but operation may have succeeded');
              }
            } catch (finalError) {
              throw new Error(`Could not add to any watchlist: ${finalError.message}`);
            }
          } else {
            throw new Error('Could not create or find watchlist');
          }
        }
      } else {
        // Add detailed logging for debugging
        console.log('==== Adding to watchlist: TMDB ID debug info ====');
        console.log(`Original movie ID: ${movieId}`);
        console.log(`Normalized movie ID for API: ${numericMovieId}`);
        console.log(`Raw movieId data type: ${typeof numericMovieId}, value: ${numericMovieId}`);
        
        // Let's examine the exact API call that's being made
      console.log(`WATCHLIST DEBUG: About to call bulkAddMovies with listId=${watchlist.id}, movieIds=[${numericMovieId}]`);
      console.log(`WATCHLIST DEBUG: Call time: ${new Date().toISOString()}`);
      console.log(`WATCHLIST DEBUG: Stack trace:`, new Error().stack);
      
      try {
        // Log the movie IDs we're adding for debugging
        console.log(`Adding movie with ID ${numericMovieId} to watchlist ${watchlist.id}`);
        console.log(`Raw movieId data type: ${typeof numericMovieId}, value: ${numericMovieId}`);
        
        const result = await bulkAddMovies(watchlist.id, [numericMovieId]);
      
        if (result) {
          console.log('BulkAddMovies response:', result); 
        } else {
          console.warn('No result returned from bulkAddMovies, but operation may have succeeded');  
        }
        } catch (error) {
          console.error('Error in bulkAddMovies operation:', error);
          throw error;
        }
      }
      
      // Refresh the token immediately to ensure we have a fresh one
      try {
        if (auth.currentUser) {
          console.log('Refreshing token after watchlist operation with force refresh...');
          
          // Force refresh token (true parameter means force refresh)
          const freshToken = await auth.currentUser.getIdToken(true);
          localStorage.setItem('auth_token', freshToken);
          
          // Small delay to let the token propagate
          await new Promise(resolve => setTimeout(resolve, 500));
          
          console.log('Token refreshed successfully, should now work for subsequent operations');
        }
      } catch (tokenError) {
        console.warn('Token refresh after watchlist operation failed', tokenError);
      }
      
      toast({
        title: "Added to Watchlist",
        description: "Movie has been added to your watchlist"
      });
      
      setIsInWatchlist(true);
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add to watchlist",
        variant: "destructive"
      });
    }
  }, [movieId, watchlist, createList, bulkAddMovies, isAuthenticated, toast]);
  
  /**
   * Remove movie from watchlist
   */
  const removeFromWatchlist = useCallback(async () => {
    console.log('removeFromWatchlist called for movie ID:', movieId);
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to manage your watchlist",
        variant: "destructive"
      });
      return;
    }
    
    if (!watchlist) {
      toast({
        title: "Error",
        description: "Watchlist not found",
        variant: "destructive"
      });
      return;
    }
    
    // Use our consistent normalization utility
    const numericMovieId = normalizeTmdbId(movieId);
    if (!numericMovieId || isNaN(numericMovieId)) {
      console.error('Invalid movie ID format:', movieId);
      toast({
        title: "Error",
        description: "Invalid movie ID format",
        variant: "destructive"
      });
      return;
    }
    
    console.log(`Removing from watchlist: ${movieId} → ${numericMovieId}`);
    
    try {
      await bulkRemoveMovies(watchlist.id, [numericMovieId]);
      
      toast({
        title: "Removed from Watchlist",
        description: "Movie has been removed from your watchlist"
      });
      
      setIsInWatchlist(false);
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove from watchlist",
        variant: "destructive"
      });
    }
  }, [movieId, watchlist, bulkRemoveMovies, isAuthenticated, toast]);
  
  /**
   * Toggle watchlist status
   */
  const toggleWatchlist = useCallback(() => {
    if (isInWatchlist) {
      removeFromWatchlist();
    } else {
      addToWatchlist();
    }
  }, [isInWatchlist, addToWatchlist, removeFromWatchlist]);
  
  // State for watch log modal
  const [watchModalOpen, setWatchModalOpen] = useState(false);

  /**
   * Open the modal to log a watch
   */
  const logWatch = useCallback(() => {
    console.log('logWatch called');
    
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to log watches",
        variant: "destructive"
      });
      return;
    }
    
    // Open the watch modal instead of redirecting
    console.log('Opening watch modal');
    setWatchModalOpen(true);
  }, [isAuthenticated, toast]);
  
  /**
   * Navigate to view watch history for this movie
   */
  const viewWatchHistory = useCallback(() => {
    router.push(`/watch-history?movieId=${movieId}`);
  }, [movieId, router]);
  
  /**
   * Toggle favorite status of the most recent watch
   */
  const toggleFavorite = useCallback(async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to mark favorites",
        variant: "destructive"
      });
      return;
    }
    
    if (!hasWatched || !mostRecentWatch) {
      // If not watched yet, prompt to log a watch
      toast({
        title: "Not Watched Yet",
        description: "Log a watch first to mark as favorite",
        action: <Button variant="default" size="sm" onClick={logWatch}>Log Watch</Button>
      });
      return;
    }
    
    try {
      await toggleFavoriteMutation({
        variables: { id: mostRecentWatch.id }
      });
      
      refetchWatchHistory();
      
      toast({
        title: isFavorite ? "Removed from Favorites" : "Added to Favorites",
        description: isFavorite 
          ? "This movie is no longer marked as a favorite" 
          : "This movie has been marked as a favorite"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update favorite status",
        variant: "destructive"
      });
    }
  }, [
    mostRecentWatch, 
    isFavorite, 
    toggleFavoriteMutation, 
    refetchWatchHistory, 
    logWatch,
    isAuthenticated,
    hasWatched,
    toast
  ]);
  
  /**
   * Callback for when a watch is successfully logged - used to trigger review prompt
   */
  const handleWatchLogged = useCallback((watchId: string, title: string, rating?: number) => {
    console.log(`Watch logged successfully, ID: ${watchId}`);
    
    // Store the watch details for potential review
    setLastLoggedWatchId(watchId);
    setMovieTitle(title);
    setLastWatchRating(rating);
    
    // Show review prompt with a slight delay to allow the modal to close first
    setTimeout(() => {
      setShowReviewPrompt(true);
    }, 300);
    
    // Also check if we need to prompt about watchlist removal
    checkAndPromptWatchlistRemoval();
    
    // Make sure to refetch the watch history
    refetchWatchHistory();
  }, [refetchWatchHistory]);
  
  /**
   * Callback to dismiss the review prompt without creating a review
   */
  const dismissReviewPrompt = useCallback(() => {
    setShowReviewPrompt(false);
    setLastLoggedWatchId(null);
  }, []);
  
  /**
   * If watched, suggest removing from watchlist
   */
  const checkAndPromptWatchlistRemoval = useCallback(() => {
    if (hasWatched && isInWatchlist) {
      toast({
        title: "Movie Watched",
        description: "This movie is still in your watchlist. Would you like to remove it?",
        action: <Button variant="default" size="sm" onClick={removeFromWatchlist}>Remove</Button>,
        duration: 8000 // Give them a bit more time to decide
      });
    }
  }, [hasWatched, isInWatchlist, removeFromWatchlist, toast]);
  
  // Get overall status of the movie
  const status: MovieStatusType = useMemo(() => {
    if (hasWatched) return 'watched';
    if (isInWatchlist) return 'watchlist';
    return 'unwatched';
  }, [hasWatched, isInWatchlist]);
  
  // Calculate some useful derived stats
  const watchCount = watchHistory.length;
  const averageRating = watchHistory.length > 0
    ? watchHistory.reduce((sum, item) => sum + (item.rating || 0), 0) / watchHistory.length
    : 0;
  
  return {
    // Status data
    status,
    isInWatchlist,
    hasWatched,
    lastWatchDate,
    mostRecentWatch,
    watchCount,
    userRating: mostRecentWatch?.rating,
    averageRating,
    isFavorite,
    watchlistItemId,
    internalMovieId,
    
    // Modal state
    watchModalOpen,
    setWatchModalOpen,
    
    // Review prompt state
    showReviewPrompt,
    lastLoggedWatchId,
    movieTitle,
    lastWatchRating,
    dismissReviewPrompt,
    
    // Loading state
    loading: loading.myLists || watchHistoryLoading || isLoadingInternalId,
    
    // Actions
    addToWatchlist,
    removeFromWatchlist,
    toggleWatchlist,
    logWatch,
    viewWatchHistory,
    toggleFavorite,
    checkAndPromptWatchlistRemoval,
    refetchWatchHistory,
    handleWatchLogged
  };
}