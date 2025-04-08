import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { LogWatchButton } from '../index';
import { 
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Clock } from 'lucide-react';
import { useMovieStatus } from '@/hooks/use-movie-status';
import { MovieActionsButton } from '@/components/movies/actions';
import { getMovieInternalId } from '@/lib/utils/movie-utils';

interface MovieCardWatchButtonProps {
  movieId: string;
  dropdownMode?: boolean; // If true, renders as a dropdown item
}

/**
 * This component is designed to be integrated into movie cards and menus
 * It can render either as a standalone button or as a dropdown menu item
 */
export function MovieCardWatchButton({ 
  movieId, 
  dropdownMode = false 
}: MovieCardWatchButtonProps) {
  const { isAuthenticated } = useAuth();
  
  // Just use the original movieId for the useMovieStatus hook
  // It will handle the internal ID resolution itself
  const { hasWatched, logWatch, viewWatchHistory } = useMovieStatus(movieId);

  if (!isAuthenticated) {
    return null;
  }

  if (dropdownMode) {
    return (
      <>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (hasWatched) {
              viewWatchHistory();
            } else {
              logWatch();
            }
          }}
          className="cursor-pointer"
        >
          <Clock className="mr-2 h-4 w-4" />
          <span>{hasWatched ? 'View Watch History' : 'Log Watch'}</span>
        </DropdownMenuItem>
      </>
    );
  }

  // Use the new unified action button for icon mode
  return (
    <MovieActionsButton
      movie={{ id: movieId, tmdbId: parseInt(movieId), title: '' }}
      displayVariant="icon-only"
      buttonVariant="ghost"
      size="sm"
      showPrimaryActionOnly
      primaryAction="watch"
    />
  );
}