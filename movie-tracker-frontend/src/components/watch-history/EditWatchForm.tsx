import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { useMutation, useQuery } from '@apollo/client';
import { GET_WATCH, UPDATE_WATCH } from './watch-history-operations';
import { MovieDataFetcher } from './utils/MovieDataFetcher';
import { useRouter } from 'next/navigation';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
import { cn } from '@/lib/utils';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
});

type WatchFormValues = z.infer<typeof watchFormSchema>;

interface EditWatchFormProps {
  watchId: string;
}

export function EditWatchForm({ watchId }: EditWatchFormProps) {
  const { toast } = useToast();
  const router = useRouter();

  // Fetch watch details
  const { loading: fetchLoading, error: fetchError, data } = useQuery(GET_WATCH, {
    variables: { id: watchId },
    fetchPolicy: 'network-only',
    onError: (error) => {
      console.error('Error fetching watch details:', error);
    }
  });

  // Initialize form
  const form = useForm<WatchFormValues>({
    resolver: zodResolver(watchFormSchema),
    defaultValues: {
      watchedAt: new Date(),
      watchType: 'FIRST_TIME',
      isFavorite: false,
      isPrivate: false,
    },
  });

  // Update form values when data is loaded
  useEffect(() => {
    if (data?.watch) {
      const watch = data.watch;
      form.reset({
        watchedAt: new Date(watch.watchedAt),
        watchType: watch.watchType,
        rating: watch.rating || undefined,
        notes: watch.notes || '',
        isFavorite: watch.isFavorite || false,
        isPrivate: watch.isPrivate || false,
        watchDuration: watch.watchDuration || undefined,
        moodRating: watch.moodRating || undefined,
      });
    }
  }, [data, form]);

  // Update watch mutation
  const [updateWatch, { loading: submitting }] = useMutation(UPDATE_WATCH, {
    onCompleted: (data) => {
      toast({
        title: "Watch updated",
        description: "Your watch entry has been successfully updated.",
        duration: 3000,
      });
      router.push('/watch-history');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update watch: ${error.message}`,
        variant: "destructive",
        duration: 5000,
      });
    }
  });

  // Handle form submission
  const onSubmit = (values: WatchFormValues) => {
    // Extract values and format for API
    const input = {
      watchedAt: values.watchedAt.toISOString(),
      watchType: values.watchType,
      rating: values.rating,
      notes: values.notes,
      isFavorite: values.isFavorite,
      isPrivate: values.isPrivate,
      watchDuration: values.watchDuration,
      moodRating: values.moodRating,
    };

    // Submit mutation
    updateWatch({
      variables: { id: watchId, input }
    });
  };

  // Display loading state
  if (fetchLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Display error state
  if (fetchError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load watch entry: {fetchError.message}
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => router.push('/watch-history')}
          >
            Go back to Watch History
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Display error if watch not found
  if (!data?.watch) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Not Found</AlertTitle>
        <AlertDescription>
          Watch entry not found. It may have been deleted.
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => router.push('/watch-history')}
          >
            Go back to Watch History
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const watch = data.watch;

  return (
    <MovieDataFetcher movieId={watch.movie}>
      {({ movie, loading: movieLoading }) => (
        <div>
          <div className="flex gap-4 items-center mb-6">
            <div className="h-20 w-14 relative overflow-hidden rounded-sm">
              {movieLoading ? (
                <div className="h-full w-full bg-muted animate-pulse" />
              ) : (
                <img 
                  src={movie.posterUrl || '/placeholder-poster.png'} 
                  alt={movie.title}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{movie.title}</h2>
              {movie.releaseYear && (
                <p className="text-muted-foreground">{movie.releaseYear}</p>
              )}
            </div>
          </div>
          
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
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
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
                      value={field.value}
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
                    <FormDescription>
                      Is this your first time watching, a rewatch, or a partial watch?
                    </FormDescription>
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
                    <FormDescription>
                      Rate the movie from 0 to 5 stars
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Watch duration */}
              <FormField
                control={form.control}
                name="watchDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Watch Duration (minutes, optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="600"
                        placeholder="e.g., 120"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription>
                      How long did you spend watching this movie? (in minutes)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Mood rating */}
              <FormField
                control={form.control}
                name="moodRating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mood Rating (Optional)</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString() || ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="How did this movie make you feel?" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">No mood selected</SelectItem>
                        <SelectItem value="1">1 - Very negative</SelectItem>
                        <SelectItem value="2">2 - Somewhat negative</SelectItem>
                        <SelectItem value="3">3 - Neutral</SelectItem>
                        <SelectItem value="4">4 - Somewhat positive</SelectItem>
                        <SelectItem value="5">5 - Very positive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      How did the movie affect your mood?
                    </FormDescription>
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
                    <FormDescription>
                      Your personal thoughts, context, or memories of this watch
                    </FormDescription>
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
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Add to favorites</FormLabel>
                        <FormDescription>
                          Mark this as a favorite watch experience
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isPrivate"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Private watch</FormLabel>
                        <FormDescription>
                          Only visible to you, won't appear in public activity
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {/* Form buttons */}
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/watch-history')}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Update Watch'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      )}
    </MovieDataFetcher>
  );
}
