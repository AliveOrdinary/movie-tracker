import React, { useState } from 'react';
import { format } from 'date-fns';
import { useMutation, useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import { 
  TOGGLE_FAVORITE_WATCH,
  DELETE_WATCH
} from './watch-history-operations';
import { 
  Card,
  CardContent
} from '@/components/ui/card';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Clock, 
  Heart, 
  MoreVertical, 
  Pencil, 
  Star, 
  Trash2, 
  Eye,
  EyeOff
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';

interface WatchHistoryItemProps {
  watch: any; // Replace with proper type when generated
  onUpdate: () => void;
}

export function WatchHistoryItem({ watch, onUpdate }: WatchHistoryItemProps) {
  const { toast } = useToast();
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  
  // Movie details query
  const GET_MOVIE = gql`
    query Movie($tmdbId: Int!) {
      movie(tmdbId: $tmdbId) {
        id
        title
        posterUrl
        releaseYear
        genres
      }
    }
  `;

  // Fetch movie details
  const { data: movieData, loading: movieLoading } = useQuery(GET_MOVIE, {
    variables: { tmdbId: typeof watch.movie === 'object' ? watch.movie.tmdbId || watch.movie.id : parseInt(watch.movie) },
    fetchPolicy: 'cache-first',
  });

  const movie = movieData?.movie || {
    id: watch.movieId,
    title: 'Loading...',
    posterUrl: null,
    releaseYear: '',
    genres: [],
  };
  
  // Format watch date
  const formattedDate = watch.watchedAt 
    ? format(new Date(watch.watchedAt), 'MMMM d, yyyy')
    : 'Unknown date';
  
  // Map watch type to text
  const watchTypeText = {
    FIRST_TIME: 'First Watch',
    REWATCH: 'Rewatch',
    PARTIAL: 'Partial Watch'
  }[watch.watchType] || 'Watch';
  
  // Toggle favorite mutation
  const [toggleFavorite] = useMutation(TOGGLE_FAVORITE_WATCH, {
    onCompleted: () => {
      onUpdate();
      toast({
        title: watch.isFavorite ? "Removed from favorites" : "Added to favorites",
        description: `${movie.title} has been ${watch.isFavorite ? "removed from" : "added to"} your favorites.`,
        duration: 3000,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Could not update favorite status: ${error.message}`,
        variant: "destructive",
        duration: 3000,
      });
    }
  });
  
  // Delete watch mutation
  const [deleteWatch, { loading: deleteLoading }] = useMutation(DELETE_WATCH, {
    onCompleted: () => {
      onUpdate();
      toast({
        title: "Watch deleted",
        description: `The watch entry for ${movie.title} has been deleted.`,
        duration: 3000,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Could not delete watch: ${error.message}`,
        variant: "destructive",
        duration: 3000,
      });
    }
  });
  
  // Handle delete confirmation
  const handleDelete = () => {
    setIsDeleteAlertOpen(true);
  };
  
  // Confirm delete
  const confirmDelete = () => {
    deleteWatch({
      variables: { id: watch.id }
    });
    setIsDeleteAlertOpen(false);
  };
  
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          {/* Movie poster */}
          <Link 
            href={`/movies/${movie.id}`}
            className="relative sm:w-[100px] h-[150px] overflow-hidden"
          >
            {movieLoading ? (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <div className="animate-pulse h-full w-full bg-muted/50"></div>
              </div>
            ) : (
              <img 
                src={movie.posterUrl || '/placeholder-poster.png'} 
                alt={movie.title}
                className="w-full h-full object-cover"
              />
            )}
            {watch.isPrivate && (
              <div className="absolute top-1 right-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="bg-background/80 text-primary rounded-full p-1">
                        <EyeOff size={14} />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Private watch</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </Link>
          
          {/* Content */}
          <div className="flex-1 p-4">
            <div className="flex justify-between">
              <div>
                <h3 className="font-medium hover:text-primary">
                  <Link href={`/movies/${movie.id}`}>{movie.title}</Link>
                  {' '}
                  {movie.releaseYear && (
                    <span className="text-muted-foreground">({movie.releaseYear})</span>
                  )}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {formattedDate} • {watchTypeText}
                </p>
              </div>
              
              <div className="flex items-start gap-2">
                {/* Rating indicator */}
                {watch.rating && (
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="fill-current h-4 w-4" />
                    <span className="text-sm font-medium">{watch.rating.toFixed(1)}</span>
                  </div>
                )}
                
                {/* Favorite button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleFavorite({
                    variables: { id: watch.id }
                  })}
                  className={watch.isFavorite ? "text-red-500" : "text-muted-foreground"}
                >
                  <Heart className={watch.isFavorite ? "fill-current" : ""} size={18} />
                </Button>
                
                {/* Actions menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical size={18} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => window.location.href = `/watch-history/edit/${watch.id}`}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={handleDelete}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            {/* Watch details */}
            <div className="mt-2 space-y-2">
              {/* Genres */}
              {movie.genres && movie.genres.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {movie.genres.slice(0, 3).map((genre: string) => (
                    <Badge key={genre} variant="secondary" className="text-xs">
                      {genre}
                    </Badge>
                  ))}
                  {movie.genres.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{movie.genres.length - 3}
                    </Badge>
                  )}
                </div>
              )}
              
              {/* Notes */}
              {watch.notes && (
                <p className="text-sm mt-2 line-clamp-2">{watch.notes}</p>
              )}
              
              {/* Watch metadata */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2">
                {watch.watchDuration > 0 && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{Math.floor(watch.watchDuration / 60)}h {watch.watchDuration % 60}m</span>
                  </div>
                )}
                
                {watch.watchCount > 1 && (
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span>Watch #{watch.watchCount}</span>
                  </div>
                )}
                
                {watch.contextTags && (
                  <div className="flex items-center gap-1">
                    <span>Tags: {watch.contextTags}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this watch entry for {movie.title}.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleteLoading}>
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
