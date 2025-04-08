import React from 'react';
import { 
  Clock, 
  CheckCircle, 
  Star, 
  Heart, 
  CalendarIcon
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useMovieStatus } from '@/hooks/use-movie-status';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export type MovieStatusIndicatorVariant = 'badge' | 'icon' | 'text' | 'compact' | 'detailed';
export type MovieStatusIndicatorSize = 'sm' | 'md' | 'lg';

interface MovieStatusIndicatorProps {
  movieId: string;
  variant?: MovieStatusIndicatorVariant;
  size?: MovieStatusIndicatorSize;
  showWatchDate?: boolean;
  showRating?: boolean;
  showFavorite?: boolean;
  className?: string;
}

export function MovieStatusIndicator({
  movieId,
  variant = 'badge',
  size = 'md',
  showWatchDate = true,
  showRating = true,
  showFavorite = true,
  className
}: MovieStatusIndicatorProps) {
  const {
    status,
    isInWatchlist,
    hasWatched,
    lastWatchDate,
    mostRecentWatch,
    isFavorite,
    userRating
  } = useMovieStatus(movieId);
  
  // Nothing to show
  if (status === 'unwatched' && !isFavorite) {
    return null;
  }
  
  // Size mappings
  const getIconSize = () => {
    switch (size) {
      case 'sm': return 'h-3 w-3';
      case 'lg': return 'h-5 w-5';
      default: return 'h-4 w-4';
    }
  };
  
  const getTextSize = () => {
    switch (size) {
      case 'sm': return 'text-xs';
      case 'lg': return 'text-base';
      default: return 'text-sm';
    }
  };
  
  // For badge variant
  if (variant === 'badge') {
    return (
      <div className={cn("flex flex-wrap gap-1.5", className)}>
        {isInWatchlist && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="flex items-center gap-1 bg-blue-500/10 text-blue-600 border-blue-200">
                  <Clock className={getIconSize()} />
                  <span className={getTextSize()}>Watchlist</span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>This movie is in your watchlist</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        {hasWatched && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="flex items-center gap-1 bg-green-500/10 text-green-600 border-green-200">
                  <CheckCircle className={getIconSize()} />
                  <span className={getTextSize()}>Watched</span>
                  {showWatchDate && lastWatchDate && (
                    <span className={cn("ml-1 opacity-80", getTextSize())}>
                      {format(lastWatchDate, 'MMM d, yyyy')}
                    </span>
                  )}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>You've watched this movie 
                  {lastWatchDate && ` on ${format(lastWatchDate, 'MMMM d, yyyy')}`}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        {showRating && hasWatched && userRating && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="flex items-center gap-1 bg-yellow-500/10 text-yellow-600 border-yellow-200">
                  <Star className={cn(getIconSize(), "fill-yellow-500 text-yellow-500")} />
                  <span className={getTextSize()}>{userRating}</span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>You rated this movie {userRating}/5</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        {showFavorite && isFavorite && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="flex items-center gap-1 bg-pink-500/10 text-pink-600 border-pink-200">
                  <Heart className={cn(getIconSize(), "fill-pink-500 text-pink-500")} />
                  <span className={getTextSize()}>Favorite</span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>This is one of your favorite movies</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    );
  }
  
  // For icon-only variant
  if (variant === 'icon') {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {isInWatchlist && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Clock className={cn(getIconSize(), "text-blue-500")} />
              </TooltipTrigger>
              <TooltipContent>
                <p>In your watchlist</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        {hasWatched && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <CheckCircle className={cn(getIconSize(), "text-green-500")} />
              </TooltipTrigger>
              <TooltipContent>
                <p>Watched
                  {lastWatchDate && ` on ${format(lastWatchDate, 'MMMM d, yyyy')}`}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        {showRating && hasWatched && userRating && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Star className={cn(getIconSize(), "fill-yellow-500 text-yellow-500")} />
              </TooltipTrigger>
              <TooltipContent>
                <p>Rated {userRating}/5</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        {showFavorite && isFavorite && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Heart className={cn(getIconSize(), "fill-pink-500 text-pink-500")} />
              </TooltipTrigger>
              <TooltipContent>
                <p>Marked as favorite</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    );
  }
  
  // For text variant
  if (variant === 'text') {
    return (
      <div className={cn("flex flex-col gap-0.5", className)}>
        {isInWatchlist && (
          <div className="flex items-center text-blue-500 gap-1.5">
            <Clock className={getIconSize()} />
            <span className={getTextSize()}>In your watchlist</span>
          </div>
        )}
        
        {hasWatched && (
          <div className="flex items-center text-green-600 gap-1.5">
            <CheckCircle className={getIconSize()} />
            <span className={getTextSize()}>
              Watched
              {showWatchDate && lastWatchDate && 
                ` on ${format(lastWatchDate, 'MMMM d, yyyy')}`
              }
            </span>
          </div>
        )}
        
        {showRating && hasWatched && userRating && (
          <div className="flex items-center text-yellow-600 gap-1.5">
            <Star className={cn(getIconSize(), "fill-yellow-500 text-yellow-500")} />
            <span className={getTextSize()}>Rated {userRating}/5</span>
          </div>
        )}
        
        {showFavorite && isFavorite && (
          <div className="flex items-center text-pink-600 gap-1.5">
            <Heart className={cn(getIconSize(), "fill-pink-500 text-pink-500")} />
            <span className={getTextSize()}>Marked as favorite</span>
          </div>
        )}
      </div>
    );
  }
  
  // For compact variant (one-line text)
  if (variant === 'compact') {
    let statusText = '';
    let StatusIcon = null;
    let colorClass = '';
    
    if (hasWatched) {
      statusText = 'Watched';
      if (showWatchDate && lastWatchDate) {
        statusText += ` on ${format(lastWatchDate, 'MMM d, yyyy')}`;
      }
      StatusIcon = CheckCircle;
      colorClass = 'text-green-600';
    } else if (isInWatchlist) {
      statusText = 'On watchlist';
      StatusIcon = Clock;
      colorClass = 'text-blue-500';
    }
    
    if (showRating && hasWatched && userRating) {
      statusText += ` • Rated ${userRating}/5`;
    }
    
    if (showFavorite && isFavorite) {
      statusText += ' • Favorite';
    }
    
    if (!statusText) return null;
    
    return (
      <div className={cn(`flex items-center gap-1.5 ${colorClass}`, className)}>
        {StatusIcon && <StatusIcon className={getIconSize()} />}
        <span className={getTextSize()}>{statusText}</span>
      </div>
    );
  }
  
  // For detailed variant (like in movie details page)
  if (variant === 'detailed') {
    return (
      <div className={cn("space-y-1", className)}>
        {hasWatched && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className={getIconSize()} />
            <span className={getTextSize()}>Watched</span>
          </div>
        )}
        
        {showWatchDate && lastWatchDate && (
          <div className="flex items-center gap-2 text-muted-foreground pl-6">
            <CalendarIcon className={getIconSize()} />
            <span className={getTextSize()}>
              {format(lastWatchDate, 'MMMM d, yyyy')}
            </span>
          </div>
        )}
        
        {isInWatchlist && (
          <div className="flex items-center gap-2 text-blue-500">
            <Clock className={getIconSize()} />
            <span className={getTextSize()}>In your watchlist</span>
          </div>
        )}
        
        {showRating && hasWatched && userRating && (
          <div className="flex items-center gap-2 text-yellow-600">
            <Star className={cn(getIconSize(), "fill-yellow-500 text-yellow-500")} />
            <span className={getTextSize()}>Your rating: {userRating}/5</span>
          </div>
        )}
        
        {showFavorite && isFavorite && (
          <div className="flex items-center gap-2 text-pink-600">
            <Heart className={cn(getIconSize(), "fill-pink-500 text-pink-500")} />
            <span className={getTextSize()}>Marked as favorite</span>
          </div>
        )}
      </div>
    );
  }
  
  return null;
}