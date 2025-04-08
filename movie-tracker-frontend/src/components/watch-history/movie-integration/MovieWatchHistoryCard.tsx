import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { GET_MOVIE_WATCH_HISTORY } from '../watch-history-operations';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  PlusCircle, 
  ClockIcon, 
  Star, 
  Heart, 
  Calendar,
  Loader2
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { formatMovieIdForApi, getMovieInternalId } from '@/lib/utils/movie-utils';

interface MovieWatchHistoryCardProps {
  movieId: string;
  movieTitle?: string;
}

export function MovieWatchHistoryCard({ movieId, movieTitle }: MovieWatchHistoryCardProps) {
  const router = useRouter();
  const [internalMovieId, setInternalMovieId] = useState<string | null>(null);
  const [isLoadingId, setIsLoadingId] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Effect to fetch internal movie ID when component mounts
  useEffect(() => {
    async function fetchInternalId() {
      if (!movieId) return;
      
      setIsLoadingId(true);
      setLoadError(null);
      
      try {
        // First check if it's already in UUID format
        if (movieId.includes('-') && 
            movieId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          setInternalMovieId(movieId);
          return;
        }
        
        // Otherwise, we need to fetch the internal ID
        const numericId = parseInt(movieId.replace(/\D/g, ''), 10);
        if (!isNaN(numericId)) {
          const id = await getMovieInternalId(numericId);
          if (id) {
            console.log(`Found internal ID ${id} for TMDB ID ${numericId}`);
            setInternalMovieId(id);
          } else {
            setLoadError(`Could not find internal ID for TMDB ID ${numericId}`);
          }
        } else {
          setLoadError(`Invalid movie ID format: ${movieId}`);
        }
      } catch (error) {
        console.error('Error fetching internal movie ID:', error);
        setLoadError('Error fetching movie data');
      } finally {
        setIsLoadingId(false);
      }
    }
    
    fetchInternalId();
  }, [movieId]);
  
  // Only run the query once we have the internal ID
  const { loading, error, data, refetch } = useQuery(GET_MOVIE_WATCH_HISTORY, {
    variables: { movieId: internalMovieId },
    skip: !internalMovieId || isLoadingId,
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
    onError: (error) => {
      console.error(`MovieWatchHistory error for ID ${internalMovieId} (original: ${movieId}):`, error.message);
    }
  });

  // Show global loading state
  if (isLoadingId || (loading && !data)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-32" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-48" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Loading watch history...</span>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Skeleton className="h-9 w-full" />
        </CardFooter>
      </Card>
    );
  }

  // Handle error states
  if (error || loadError) {
    console.error('MovieWatchHistory detailed error:', error ? JSON.stringify(error) : loadError);
    
    return (
      <Card>
        <CardHeader>
          <CardTitle>Watch History</CardTitle>
          <CardDescription>
            Track your watch history for this movie
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTitle>Error loading watch history</AlertTitle>
            <AlertDescription>
              {loadError || "There was an issue loading your watch history. We'll improve this soon!"}
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={() => router.push(`/watch-history/add/${movieId}`)}
            className="w-full flex items-center gap-1"
          >
            <PlusCircle className="h-4 w-4" />
            Log Watch
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Check if we have any watch history entries
  const watches = data?.movieWatchHistory || [];
  
  if (watches.length > 0) {
    // Display the most recent watch
    const mostRecentWatch = watches[0]; // Assuming they're sorted by date
    
    return (
      <Card>
        <CardHeader>
          <CardTitle>Watch History</CardTitle>
          <CardDescription>
            You've watched this movie {watches.length} time{watches.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Last watched: {format(new Date(mostRecentWatch.watchedAt), 'MMM d, yyyy')}
              </span>
            </div>
            {mostRecentWatch.rating && (
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">Your rating: {mostRecentWatch.rating}/5</span>
              </div>
            )}
            {mostRecentWatch.isFavorite && (
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-red-500" />
                <span className="text-sm">Marked as favorite</span>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline"
            onClick={() => router.push(`/watch-history?movieId=${internalMovieId || movieId}`)}
            className="flex items-center gap-1"
          >
            <ClockIcon className="h-4 w-4" />
            View All
          </Button>
          <Button 
            onClick={() => router.push(`/watch-history/add/${movieId}`)}
            className="flex items-center gap-1"
          >
            <PlusCircle className="h-4 w-4" />
            Log Watch
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Empty state - no watches yet
  return (
    <Card>
      <CardHeader>
        <CardTitle>Watch History</CardTitle>
        <CardDescription>
          You haven't watched this movie yet
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Button 
          onClick={() => router.push(`/watch-history/add/${movieId}`)}
          className="w-full flex items-center gap-1"
        >
          <PlusCircle className="h-4 w-4" />
          Log Watch
        </Button>
      </CardFooter>
    </Card>
  );
}