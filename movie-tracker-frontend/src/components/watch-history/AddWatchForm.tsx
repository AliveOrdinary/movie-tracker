import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { useMutation, useQuery, useApolloClient } from '@apollo/client';
import { CREATE_WATCH } from './watch-history-operations';
import { useRouter } from 'next/navigation';
import { debounce } from 'lodash';
import { getMovieInternalId } from '@/lib/utils/movie-utils';

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
import { CalendarIcon, Search, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { gql } from '@apollo/client';

// Rating slider component (to be defined)
import { RatingInput } from './RatingInput';

// Movie search query
const SEARCH_MOVIES = gql`
  query SearchMovies($query: String!, $page: Int) {
    searchMovies(query: $query, page: $page) {
      id
      title
      poster_path
      release_date
      vote_average
    }
  }
`;

// Define form schema with Zod
const watchFormSchema = z.object({
  movieId: z.string({
    required_error: "Please select a movie",
  }),
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

interface AddWatchFormProps {
  preselectedMovieId?: string;
}

export function AddWatchForm({ preselectedMovieId }: AddWatchFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMovie, setSelectedMovie] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const client = useApolloClient(); // Get Apollo client at component level

  // Default form values
  const defaultValues: Partial<WatchFormValues> = {
    watchedAt: new Date(),
    watchType: 'FIRST_TIME',
    isFavorite: false,
    isPrivate: false,
  };

  // Initialize form
  const form = useForm<WatchFormValues>({
    resolver: zodResolver(watchFormSchema),
    defaultValues,
  });

  // Create watch mutation
  const [createWatch, { loading: submitting }] = useMutation(CREATE_WATCH, {
    onCompleted: (data) => {
      toast({
        title: "Watch added",
        description: "Your watch has been successfully logged.",
        duration: 3000,
      });
      router.push('/watch-history');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to log watch: ${error.message}`,
        variant: "destructive",
        duration: 5000,
      });
    }
  });

  // Movie search query
  const { loading: searchLoading, data: searchResults, refetch: searchMovies } = useQuery(SEARCH_MOVIES, {
    variables: { query: '', page: 1 },
    skip: true, // Don't run query on component mount
  });

  // Debounced search function
  const debouncedSearch = debounce((query: string) => {
    if (query.length >= 2) {
      setIsSearching(true);
      searchMovies({ query, page: 1 })
        .finally(() => setIsSearching(false));
    }
  }, 500);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

    // Helper to determine the movie ID value we need to use 
    // Extract ID from tmdbId or id field depending on what's available
    const getMovieId = (movie: any) => {
      if (!movie) return '';
      // If it's already a string, just return it
      if (typeof movie === 'string') return movie;
      // Otherwise extract the ID
      return movie.id || String(movie.tmdbId || '');
    };

    // Handle movie selection
    const handleSelectMovie = (movie: any) => {
      setSelectedMovie(movie);
      form.setValue('movieId', getMovieId(movie));
      setSearchQuery('');
    };

  // Handle form submission
  const onSubmit = async (values: WatchFormValues) => {
    // Try to get the internal movie ID if possible
    let submissionMovieId = values.movieId;
    
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
    const input = {
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

    // Submit mutation
    createWatch({
      variables: { input }
    });
  };

  // Effect to prefill movie if ID is provided
  useEffect(() => {
    if (preselectedMovieId) {
      console.log('Preselected movie ID:', preselectedMovieId);
      
      // If the ID contains a tmdb- prefix, extract the numeric ID
      let tmdbId: number | null = null;
      
      if (preselectedMovieId.startsWith('tmdb-')) {
        // Extract the numeric part after the prefix
        const numericPart = preselectedMovieId.substring(5); // 'tmdb-'.length = 5
        tmdbId = parseInt(numericPart, 10);
      } else {
        // Try to parse directly as number (legacy format)
        tmdbId = parseInt(preselectedMovieId, 10);
      }
      
      // Only proceed if we could parse a valid tmdbId
      if (!isNaN(tmdbId)) {
        // Query to fetch movie details
        const GET_MOVIE = gql`
          query Movie($tmdbId: Int!) {
            movie(tmdbId: $tmdbId) {
              id
              title
              posterUrl
              releaseYear
              overview
              voteAverage
              poster_path
              release_date
            }
          }
        `;
        
        // Get Apollo client reference outside of the effect to avoid hook rules
        client.query({
          query: GET_MOVIE,
          variables: { tmdbId }
        }).then(result => {
          if (result.data?.movie) {
            setSelectedMovie(result.data.movie);
            form.setValue('movieId', preselectedMovieId);
          }
        }).catch(err => {
          console.error('Error fetching preselected movie:', err);
        });
      }
    }
  }, [preselectedMovieId, form, client]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Movie selection */}
        <FormField
          control={form.control}
          name="movieId"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Movie</FormLabel>
              <div className="relative">
                <Input
                  placeholder="Search for a movie..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="mb-2"
                />
                {isSearching && (
                  <div className="absolute right-3 top-3">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
                {(searchQuery.length > 0 && !isSearching) && (
                  <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                    {searchResults?.searchMovies?.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">No movies found</div>
                    ) : (
                      searchResults?.searchMovies?.map((movie: any) => (
                        <div
                          key={movie.id || movie.tmdbId}
                          className="flex items-center gap-2 p-2 hover:bg-muted cursor-pointer"
                          onClick={() => handleSelectMovie(movie)}
                        >
                          {movie.poster_path ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                              alt={movie.title}
                              className="h-12 w-8 object-cover rounded"
                            />
                          ) : (
                            <div className="h-12 w-8 bg-muted flex items-center justify-center rounded">
                              <span className="text-xs">No img</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{movie.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {movie.release_date ? new Date(movie.release_date).getFullYear() : 'Unknown year'}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              {selectedMovie ? (
                <div className="flex items-center gap-3 p-3 border rounded-md">
                  {selectedMovie.poster_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w92${selectedMovie.poster_path}`}
                      alt={selectedMovie.title}
                      className="h-16 w-12 object-cover rounded"
                    />
                  ) : (
                    <div className="h-16 w-12 bg-muted flex items-center justify-center rounded">
                      <span className="text-xs">No image</span>
                    </div>
                  )}
                  <div>
                    <div className="font-medium">{selectedMovie.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {selectedMovie.release_date ? new Date(selectedMovie.release_date).getFullYear() : 'Unknown year'}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="ml-auto"
                    onClick={() => {
                      setSelectedMovie(null);
                      form.setValue('movieId', '');
                    }}
                  >
                    Change
                  </Button>
                </div>
              ) : field.value ? (
                <div className="flex items-center gap-3 p-3 border rounded-md">
                  <div className="h-16 w-12 bg-muted flex items-center justify-center rounded">
                    <span className="text-xs">Loading...</span>
                  </div>
                  <div>
                    <div className="font-medium">Selected movie</div>
                    <div className="text-sm text-muted-foreground">
                      ID: {field.value}
                    </div>
                  </div>
                </div>
              ) : null}
              <FormMessage />
            </FormItem>
          )}
        />

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
                value={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="How did this movie make you feel?" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
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
              'Save Watch'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
