import React from 'react';
import { 
  Clock,
  CheckCircle, 
  PlusCircle, 
  ListPlus,
  MoreHorizontal
} from 'lucide-react';
import { Button, ButtonProps } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { useMovieStatus } from '@/hooks/use-movie-status';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { MovieActionsModal } from './MovieActionsModal';
import { LogWatchModal } from '@/components/watch-history/LogWatchModal';
import { PostWatchReviewPrompt } from '@/components/reviews/PostWatchReviewPrompt';

export type MovieActionsVariant = 'full' | 'compact' | 'dropdown' | 'icon-only' | 'pill';

interface MovieActionsButtonProps extends Omit<ButtonProps, 'variant'> {
  movie: {
    id: string;
    tmdbId: number;
    title: string;
  };
  displayVariant?: MovieActionsVariant;
  buttonVariant?: ButtonProps['variant'];
  showPrimaryActionOnly?: boolean;
  primaryAction?: 'watchlist' | 'watch' | 'list';
  onActionComplete?: () => void;
}

export function MovieActionsButton({
  movie,
  displayVariant = 'full',
  buttonVariant = 'default',
  showPrimaryActionOnly = false,
  primaryAction = 'watchlist',
  onActionComplete,
  className,
  ...props
}: MovieActionsButtonProps) {
  console.log(`MovieActionsButton for movie: ${movie.title} (${movie.id})`, { primaryAction, displayVariant });
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [actionsModalOpen, setActionsModalOpen] = React.useState(false);
  
  // Make sure we're using the numeric TMDB ID for all operations that depend on it
  // This ensures consistency across the application
  const tmdbId = movie.tmdbId ? movie.tmdbId.toString() : movie.id;
  console.log(`Using normalized TMDB ID for movie status: ${tmdbId} (original id: ${movie.id})`);
  
  // Get movie status using our custom hook
  const { 
    status,
    isInWatchlist,
    hasWatched,
    lastWatchDate,
    toggleWatchlist,
    logWatch,
    viewWatchHistory,
    watchModalOpen,
    setWatchModalOpen,
    refetchWatchHistory,
    
    // Review integration props
    showReviewPrompt,
    lastLoggedWatchId,
    movieTitle,
    lastWatchRating,
    dismissReviewPrompt,
    handleWatchLogged
  } = useMovieStatus(tmdbId);
  
  // Handle the primary action based on configuration and movie status
  const handlePrimaryAction = async () => {
    console.log('handlePrimaryAction called:', { primaryAction, hasWatched });
    
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to perform this action",
        variant: "destructive"
      });
      return;
    }
    
    try {
      switch (primaryAction) {
        case 'watchlist':
          await toggleWatchlist();
          break;
        case 'watch':
          hasWatched ? viewWatchHistory() : logWatch();
          break;
        case 'list':
          setActionsModalOpen(true);
          break;
      }
      
      onActionComplete?.();
    } catch (error) {
      console.error('Error performing primary action:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to perform action",
        variant: "destructive"
      });
    }
  };

  // Open the full actions modal
  const openActionsModal = () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to perform this action",
        variant: "destructive"
      });
      return;
    }
    
    setActionsModalOpen(true);
  };

  // Handle successful watch logging
  const onWatchLogged = () => {
    // Call the hook's handler with the necessary info
    handleWatchLogged(
      // We don't have the watch ID immediately, but it will be obtained after the mutation
      'placeholder-id',
      movie.title,
      undefined // Rating will be determined by the user in the form
    );
    
    // Also call the parent component's handler if provided
    onActionComplete?.();
  };

  // Display for primary action button
  const primaryActionContent = () => {
    switch (primaryAction) {
      case 'watchlist':
        return {
          icon: isInWatchlist ? <CheckCircle className="h-4 w-4" /> : <PlusCircle className="h-4 w-4" />,
          text: isInWatchlist ? "On Watchlist" : "Add to Watchlist"
        };
      case 'watch':
        return {
          icon: hasWatched ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />,
          text: hasWatched 
            ? `Watched ${lastWatchDate ? format(lastWatchDate, 'MMM d, yyyy') : ''}` 
            : "Mark as Watched"
        };
      case 'list':
        return {
          icon: <ListPlus className="h-4 w-4" />,
          text: "Add to List"
        };
    }
  };
  
  // If we're only showing the primary action, render a simple button
  if (showPrimaryActionOnly) {
    const { icon, text } = primaryActionContent();
    
    if (displayVariant === 'icon-only') {
      return (
        <>
          <Button
            variant={buttonVariant}
            size="icon"
            className={className}
            onClick={handlePrimaryAction}
            {...props}
          >
            {icon}
          </Button>
          
          {/* Log Watch Modal */}
          <LogWatchModal
            movie={movie}
            open={watchModalOpen}
            onOpenChange={setWatchModalOpen}
            onWatchLogged={onWatchLogged}
          />
          
          {/* Post-watch review prompt */}
          {showReviewPrompt && (
            <PostWatchReviewPrompt
              movieId={movie.id}
              movieTitle={movie.title}
              watchHistoryId={lastLoggedWatchId || ''}
              watchRating={lastWatchRating}
              onClose={dismissReviewPrompt}
              visible={showReviewPrompt}
            />
          )}
        </>
      );
    }
    
    if (displayVariant === 'pill') {
      return (
        <>
          <Badge 
            variant={buttonVariant === 'default' ? 'default' : 'outline'}
            className={cn("cursor-pointer hover:bg-accent", className)}
            onClick={handlePrimaryAction}
            {...props}
          >
            {icon}
            <span className="ml-1 text-xs">{text}</span>
          </Badge>
          
          {/* Log Watch Modal */}
          <LogWatchModal
            movie={movie}
            open={watchModalOpen}
            onOpenChange={setWatchModalOpen}
            onWatchLogged={onWatchLogged}
          />
          
          {/* Post-watch review prompt */}
          {showReviewPrompt && (
            <PostWatchReviewPrompt
              movieId={movie.id}
              movieTitle={movie.title}
              watchHistoryId={lastLoggedWatchId || ''}
              watchRating={lastWatchRating}
              onClose={dismissReviewPrompt}
              visible={showReviewPrompt}
            />
          )}
        </>
      );
    }
    
    return (
      <>
        <Button
          variant={buttonVariant}
          size={displayVariant === 'compact' ? 'sm' : 'default'}
          className={className}
          onClick={handlePrimaryAction}
          {...props}
        >
          {icon}
          {displayVariant !== 'compact' && <span className="ml-2">{text}</span>}
        </Button>
        
        {/* Log Watch Modal */}
        <LogWatchModal
          movie={movie}
          open={watchModalOpen}
          onOpenChange={setWatchModalOpen}
          onWatchLogged={onWatchLogged}
        />
        
        {/* Post-watch review prompt */}
        {showReviewPrompt && (
          <PostWatchReviewPrompt
            movieId={movie.id}
            movieTitle={movie.title}
            watchHistoryId={lastLoggedWatchId || ''}
            watchRating={lastWatchRating}
            onClose={dismissReviewPrompt}
            visible={showReviewPrompt}
          />
        )}
      </>
    );
  }
  
  // If we're showing a dropdown
  if (displayVariant === 'dropdown') {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={buttonVariant}
              size="icon"
              className={className}
              {...props}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {/* Watchlist option */}
            <DropdownMenuItem onClick={toggleWatchlist}>
              {isInWatchlist ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  <span>Remove from Watchlist</span>
                </>
              ) : (
                <>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  <span>Add to Watchlist</span>
                </>
              )}
            </DropdownMenuItem>
            
            {/* Watch option */}
            <DropdownMenuItem onClick={hasWatched ? viewWatchHistory : logWatch}>
              {hasWatched ? (
                <>
                  <Clock className="mr-2 h-4 w-4" />
                  <span>View Watch History</span>
                </>
              ) : (
                <>
                  <Clock className="mr-2 h-4 w-4" />
                  <span>Mark as Watched</span>
                </>
              )}
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            {/* Add to list option */}
            <DropdownMenuItem onClick={() => setActionsModalOpen(true)}>
              <ListPlus className="mr-2 h-4 w-4" />
              <span>Add to List</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <MovieActionsModal
          movie={movie}
          open={actionsModalOpen}
          onOpenChange={setActionsModalOpen}
        />
        
        {/* Log Watch Modal */}
        <LogWatchModal
          movie={movie}
          open={watchModalOpen}
          onOpenChange={setWatchModalOpen}
          onWatchLogged={onWatchLogged}
        />
        
        {/* Post-watch review prompt */}
        {showReviewPrompt && (
          <PostWatchReviewPrompt
            movieId={movie.id}
            movieTitle={movie.title}
            watchHistoryId={lastLoggedWatchId || ''}
            watchRating={lastWatchRating}
            onClose={dismissReviewPrompt}
            visible={showReviewPrompt}
          />
        )}
      </>
    );
  }
  
  // Default full button
  return (
    <>
      <Button
        variant={buttonVariant}
        className={className}
        onClick={openActionsModal}
        {...props}
      >
        {status === 'watched' ? (
          <>
            <CheckCircle className="mr-2 h-4 w-4" />
            <span>Watched</span>
          </>
        ) : status === 'watchlist' ? (
          <>
            <CheckCircle className="mr-2 h-4 w-4" />
            <span>On Watchlist</span>
          </>
        ) : primaryAction === 'watchlist' ? (
          <>
            <PlusCircle className="mr-2 h-4 w-4" />
            <span>Add to Watchlist</span>
          </>
        ) : primaryAction === 'watch' ? (
          <>
            <Clock className="mr-2 h-4 w-4" />
            <span>Mark as Watched</span>
          </>
        ) : primaryAction === 'list' ? (
          <>
            <ListPlus className="mr-2 h-4 w-4" />
            <span>Add to List</span>
          </>
        ) : (
          <>
            <PlusCircle className="mr-2 h-4 w-4" />
            <span>Add to Collection</span>
          </>
        )}
      </Button>
      
      <MovieActionsModal
        movie={movie}
        open={actionsModalOpen}
        onOpenChange={setActionsModalOpen}
      />

      {/* Log Watch Modal */}
      <LogWatchModal
        movie={movie}
        open={watchModalOpen}
        onOpenChange={setWatchModalOpen}
        onWatchLogged={onWatchLogged}
      />
      
      {/* Post-watch review prompt */}
      {showReviewPrompt && (
        <PostWatchReviewPrompt
          movieId={movie.id}
          movieTitle={movie.title}
          watchHistoryId={lastLoggedWatchId || ''}
          watchRating={lastWatchRating}
          onClose={dismissReviewPrompt}
          visible={showReviewPrompt}
        />
      )}
    </>
  );
}