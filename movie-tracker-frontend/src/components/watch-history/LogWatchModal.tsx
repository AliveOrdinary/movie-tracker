import React, { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CREATE_WATCH } from './watch-history-operations';
// Import from reviews file for consistency
import { CREATE_REVIEW } from '@/types/graphql/reviews';
import { GET_MOVIE_REVIEWS } from '@/types/graphql/movies';
import { getMovieInternalId } from '@/lib/utils/movie-utils';
import { WatchType } from '@/types/generated/graphql';
import { useToast } from '@/hooks/use-toast';
import { normalizeTmdbId } from '@/lib/utils/movie-utils';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Loader2, InfoIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Define form schema with Zod
const watchFormSchema = z.object({
  watchedAt: z.date({
    required_error: "Please select a date",
  }),
  watchType: z.enum(['FIRST_TIME', 'REWATCH', 'PARTIAL'], {
    required_error: "Please select a watch type",
  }),
  rating: z.number().min(0).max(5).optional(),
  notes: z.string().max(500).optional(),
  isFavorite: z.boolean().default(false),
  isPrivate: z.boolean().default(false),
  watchDuration: z.number().min(0).max(600).optional(),
  moodRating: z.number().min(1).max(5).optional(),
  // New fields for review integration
  createReview: z.boolean().default(false),
  containsSpoilers: z.boolean().default(false),
  reviewContent: z.string().max(300).optional(),
});

type WatchFormValues = z.infer<typeof watchFormSchema>;

interface LogWatchModalProps {
  movie: {
    id: string;
    tmdbId: number;
    title: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWatchLogged?: () => void;
}

export function LogWatchModal({ movie, open, onOpenChange, onWatchLogged }: LogWatchModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [watchHistoryId, setWatchHistoryId] = useState<string | null>(null);
  const [tmdbId, setTmdbId] = useState<number | null>(null);
  
  // Extract TMDB ID from movie
  useEffect(() => {
    // First check if the movie already has a tmdbId property
    if (movie.tmdbId) {
      setTmdbId(movie.tmdbId);
      return;
    }
    
    // Otherwise try to extract it from the ID
    const extractedId = normalizeTmdbId(movie.id);
    if (extractedId && extractedId > 0) {
      console.log(`Extracted TMDB ID ${extractedId} from movie ID ${movie.id}`);
      setTmdbId(extractedId);
    }
  }, [movie]);
  
  // Default form values
  const defaultValues: Partial<WatchFormValues> = {
    watchedAt: new Date(),
    watchType: 'FIRST_TIME',
    isFavorite: false,
    isPrivate: false,
    createReview: false,
    containsSpoilers: false
  };

  // Initialize form
  const form = useForm<WatchFormValues>({
    resolver: zodResolver(watchFormSchema),
    defaultValues,
  });

  // Watch for createReview changes to validate reviewContent
  const createReview = form.watch('createReview');
  const rating = form.watch('rating');
  const notes = form.watch('notes');

  // Create watch mutation
  const [createWatch] = useMutation(CREATE_WATCH, {
    onCompleted: (data) => {
      // Store the watch history ID for potential review creation
      if (data.createWatch && data.createWatch.id) {
        setWatchHistoryId(data.createWatch.id);
        
        // If user wants to create a review, use that ID
        if (form.getValues('createReview')) {
          submitReview();
        } else {
          completeSubmission();
        }
      } else {
        completeSubmission();
      }
    },
    onError: (error) => {
      setIsSubmitting(false);
      toast({
        title: "Error",
        description: `Failed to log watch: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Create review mutation
  const [submitReviewMutation] = useMutation(CREATE_REVIEW, {
    onCompleted: (data) => {
      console.log('Review created successfully:', data);
      toast({
        title: "Review Added",
        description: "Your review has been published.",
      });
      completeSubmission();
    },
    onError: (error) => {
      // Still mark the watch as successful even if the review fails
      console.error('Error creating review from watch:', error.message);
      if (error.graphQLErrors) {
        console.error('GraphQL Errors:', error.graphQLErrors);
      }
      if (error.networkError) {
        console.error('Network Error:', error.networkError);
      }
      
      toast({
        title: "Watch Logged, Review Failed",
        description: `Your watch was recorded but we couldn't create your review: ${error.message}`,
        variant: "destructive",
      });
      completeSubmission();
    },
    update: (cache, { data }) => {
      // Manual cache update to avoid the 'Missing field movieReviews' error
      try {
        if (data?.createReview) {
          const newReview = data.createReview;
          const movieId = String(movie.id);
          
          // Read existing reviews if they exist in cache
          try {
            const existingData = cache.readQuery({
              query: GET_MOVIE_REVIEWS,
              variables: { movieId }
            });
            
            if (existingData?.movieReviews) {
              // Update the cache with the new review added
              cache.writeQuery({
                query: GET_MOVIE_REVIEWS,
                variables: { movieId },
                data: {
                  movieReviews: [newReview, ...existingData.movieReviews]
                }
              });
            }
          } catch (readError) {
            console.log('Cache read error (normal for first review):', readError.message);
            // Initialize the cache if it doesn't exist
            cache.writeQuery({
              query: GET_MOVIE_REVIEWS,
              variables: { movieId },
              data: {
                movieReviews: [newReview]
              }
            });
          }
        }
      } catch (cacheError) {
        console.error('Cache update error:', cacheError);
      }
    }
  });

  // Helper to complete the submission process
  const completeSubmission = () => {
    setIsSubmitting(false);
    onOpenChange(false);
    toast({
      title: "Watch Logged",
      description: `You've recorded ${movie.title} as watched.`,
    });
    if (onWatchLogged) {
      onWatchLogged();
    }
  };

  // Handle form submission
  const onSubmit = async (values: WatchFormValues) => {
    setIsSubmitting(true);
    
    // Try to get the internal movie ID if possible
    let submissionMovieId = String(movie.id);
    
    // Only try to get internal ID if it looks like a TMDB ID (numeric)
    const numericId = parseInt(submissionMovieId, 10);
    if (!isNaN(numericId) && !submissionMovieId.includes('-')) {
      try {
        const internalId = await getMovieInternalId(numericId);
        if (internalId) {
          console.log(`Using internal ID ${internalId} for submission instead of ${submissionMovieId}`);
          submissionMovieId = internalId;
        }
      } catch (error) {
        console.error('Error getting internal movie ID:', error);
        // Continue with original ID as fallback
      }
    }
    
    // Extract values and format for API
    const watchInput = {
      movieId: submissionMovieId,
      watchedAt: values.watchedAt.toISOString(),
      watchType: values.watchType,
      rating: values.rating,
      notes: values.notes,
      isFavorite: values.isFavorite,
      isPrivate: values.isPrivate,
      watchDuration: values.watchDuration,
      moodRating: values.moodRating,
    };

    // Submit watch mutation
    createWatch({
      variables: { input: watchInput }
    });
  };

  // Handle review creation after watch is logged
  const submitReview = () => {
    const reviewText = form.getValues('reviewContent') || form.getValues('notes') || '';
    
    // If no content is provided for the review, use a default message
    if (!reviewText.trim()) {
      console.warn('No review content provided, using a default message');
    }
    
    // Format content with fallback
    let content = reviewText.trim() || 
      `I watched this movie on ${format(form.getValues('watchedAt'), 'MMMM d, yyyy')}.`;
    
    // Ensure minimum content length - backend requires at least 10 chars
    if (content.length < 10) {
      content = content.padEnd(10, ' '); // Ensure minimum length
    }
    
    // Ensure we have valid rating (backend requires 1-10)
    const rawRating = form.getValues('rating') || 5; // Default to 5 if not provided
    const intRating = Math.min(10, Math.max(1, Math.round(rawRating))); // Ensure 1-10 range
    
    // Format movie ID as string
    const movieIdStr = String(movie.id);
    
    // Format containsSpoilers as boolean
    const boolContainsSpoilers = Boolean(form.getValues('containsSpoilers'));
    
    // Format watch history ID if it exists
    const watchHistoryIdStr = watchHistoryId ? String(watchHistoryId) : undefined;
    
    // Include the tmdbId in the input if available
    const movieMetadata = tmdbId ? { tmdbId } : undefined;
    
    console.log('Creating review with:', {
      movieId: movieIdStr,
      rating: intRating,
      content,
      containsSpoilers: boolContainsSpoilers,
      watchHistoryId: watchHistoryIdStr,
      movieMetadata
    });
    
    try {
      // Using explicit construction to ensure proper types
      submitReviewMutation({
        variables: {
          input: {
            movieId: movieIdStr,
            rating: intRating,
            content,
            containsSpoilers: boolContainsSpoilers,
            ...(watchHistoryIdStr ? { watchHistoryId: watchHistoryIdStr } : {}),
            ...(tmdbId ? { movieMetadata: JSON.stringify({ tmdbId }) } : {})
          }
        }
      });
    } catch (error) {
      console.error('Error submitting review:', error);
      // Still complete the process since the watch was logged successfully
      completeSubmission();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Log Watch: {movie.title}</DialogTitle>
          <DialogDescription>
            Record when you watched this movie and add details.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Watch date */}
            <FormField
              control={form.control}
              name="watchedAt"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Watch Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <Calendar className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    When did you watch this movie?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Watch type */}
            <FormField
              control={form.control}
              name="watchType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Watch Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a watch type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="FIRST_TIME">First Time</SelectItem>
                      <SelectItem value="REWATCH">Rewatch</SelectItem>
                      <SelectItem value="PARTIAL">Partial (didn't finish)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Rating */}
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rating (Optional)</FormLabel>
                  <FormControl>
                    <div className="pt-2">
                      <input 
                        type="range"
                        min="0"
                        max="5"
                        step="0.5"
                        value={field.value || 0}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>Unrated</span>
                        <span>★ {field.value || 0}</span>
                        <span>★★★★★</span>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any thoughts or notes about this watch..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Checkbox options */}
            <div className="flex flex-col space-y-4">
              <FormField
                control={form.control}
                name="isFavorite"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Add to favorites</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isPrivate"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Private watch (only visible to you)</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              {/* Create Review option */}
              <FormField
                control={form.control}
                name="createReview"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          // If user checks this and they already entered notes, copy to review content
                          if (checked && notes && !form.getValues('reviewContent')) {
                            form.setValue('reviewContent', notes);
                          }
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <div className="flex items-center">
                        <FormLabel>Create a public review</FormLabel>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <InfoIcon className="h-4 w-4 ml-1 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>Reviews are public and appear on the movie's page for other users to see.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </FormItem>
                )}
              />
            </div>
            
            {/* Show review fields if createReview is checked */}
            {createReview && (
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-medium">Review Details</h3>
                
                {/* Review content */}
                <FormField
                  control={form.control}
                  name="reviewContent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Review Content</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Write your review here..."
                          className="resize-none"
                          {...field}
                          defaultValue={notes || ''}
                        />
                      </FormControl>
                      <FormDescription>
                        This review will be visible to other users (max 300 characters)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Contains spoilers */}
                <FormField
                  control={form.control}
                  name="containsSpoilers"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Contains spoilers</FormLabel>
                        <FormDescription>
                          Your review will be hidden behind a spoiler warning
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                {/* Rating reminder */}
                {!rating && (
                  <div className="text-sm text-amber-500 flex items-center">
                    <InfoIcon className="h-4 w-4 mr-1" />
                    Don't forget to add a rating for your review above
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Watch'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}