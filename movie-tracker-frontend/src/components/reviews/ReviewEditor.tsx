// src/components/reviews/ReviewEditor.tsx
'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery, gql } from '@apollo/client';
import { Star, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { CREATE_REVIEW, UPDATE_REVIEW } from '@/types/graphql/reviews';
import { GET_MOVIE_REVIEWS } from '@/types/graphql/movies';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { normalizeTmdbId } from '@/lib/utils/movie-utils';

// Query to fetch the tmdbId for a movie
const GET_MOVIE_TMDB_ID = gql`
  query GetMovieTmdbId($id: ID!) {
    movie(tmdbId: $id) {
      id
      tmdbId
    }
  }
`;

interface ReviewEditorProps {
  movieId?: string;
  reviewId?: string;
  initialRating?: number;
  initialContent?: string;
  initialContainsSpoilers?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
  mode?: 'create' | 'edit';
  tmdbId?: number;  // Optional TMDB ID if already known
}

export function ReviewEditor({
  movieId,
  reviewId,
  initialRating = 0,
  initialContent = '',
  initialContainsSpoilers = false,
  onSuccess,
  onCancel,
  mode = 'create',
  tmdbId: initialTmdbId,
}: ReviewEditorProps) {
  const { toast } = useToast();
  const [rating, setRating] = useState(initialRating);
  const [content, setContent] = useState(initialContent);
  const [containsSpoilers, setContainsSpoilers] = useState(initialContainsSpoilers);
  const [isHoveringRating, setIsHoveringRating] = useState(false);
  const [tempRating, setTempRating] = useState(0);
  const [tmdbId, setTmdbId] = useState<number | null>(initialTmdbId || null);
  
  // For hover effect on star rating
  const displayRating = isHoveringRating ? tempRating : rating;

  // If we have a movieId but no tmdbId, try to get it
  useEffect(() => {
    if (movieId && !tmdbId && mode === 'create') {
      // Try to extract TMDB ID directly from movieId
      const extractedId = normalizeTmdbId(movieId);
      if (extractedId && extractedId > 0) {
        console.log(`Extracted TMDB ID ${extractedId} from movieId ${movieId}`);
        setTmdbId(extractedId);
      }
    }
  }, [movieId, tmdbId, mode]);

  // Create review mutation
  const [createReview, { loading: createLoading, error: createError }] = useMutation(CREATE_REVIEW, {
    onCompleted: (data) => {
      console.log('Review created successfully:', data);
      toast({
        title: 'Review Submitted',
        description: 'Your review has been submitted successfully',
      });
      resetForm();
      onSuccess?.();
    },
    onError: (error) => {
      console.error('Error creating review:', error.message);
      console.error('GraphQL Errors:', error.graphQLErrors);
      console.error('Network Error:', error.networkError);
      
      // Check for specific error types
      if (error.message.includes('already reviewed')) {
        toast({
          variant: 'destructive',
          title: 'Already Reviewed',
          description: 'You have already reviewed this movie. Try editing your existing review.',
        });
        
        // Force refetch to get existing reviews
        setTimeout(() => onSuccess?.(), 100);
      } else {
        toast({
          variant: 'destructive',
          title: 'Submission Failed',
          description: `Error: ${error.message}`,
        });
      }
    },
    update: (cache, { data }) => {
      // Manual cache update to avoid the 'Missing field movieReviews' error
      try {
        if (data?.createReview && movieId) {
          const newReview = data.createReview;
          
          // Read existing reviews if they exist in cache
          try {
            const existingData = cache.readQuery({
              query: GET_MOVIE_REVIEWS,
              variables: { movieId: String(movieId) }
            });
            
            if (existingData?.movieReviews) {
              // Update the cache with the new review added
              cache.writeQuery({
                query: GET_MOVIE_REVIEWS,
                variables: { movieId: String(movieId) },
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
              variables: { movieId: String(movieId) },
              data: {
                movieReviews: [newReview]
              }
            });
          }
        }
      } catch (cacheError) {
        console.error('Cache update error:', cacheError);
      }
    },
    // We'll handle cache updates manually
    refetchQueries: [],
  });

  // Update review mutation
  const [updateReview, { loading: updateLoading, error: updateError }] = useMutation(UPDATE_REVIEW, {
    onCompleted: () => {
      toast({
        title: 'Review Updated',
        description: 'Your review has been updated successfully',
      });
      onSuccess?.();
    },
    refetchQueries: movieId ? [{ query: GET_MOVIE_REVIEWS, variables: { movieId } }] : [],
  });

  const isLoading = createLoading || updateLoading;
  const error = createError || updateError;

  const resetForm = () => {
    setRating(0);
    setContent('');
    setContainsSpoilers(false);
  };

  const handleSubmit = async () => {
    if (!rating) {
      toast({
        variant: 'destructive',
        title: 'Rating Required',
        description: 'Please select a rating before submitting',
      });
      return;
    }

    if (!content.trim()) {
      toast({
        variant: 'destructive',
        title: 'Review Required',
        description: 'Please write a review before submitting',
      });
      return;
    }

    try {
      if (mode === 'create' && movieId) {
        console.log('Creating review for movie ID:', movieId);
        console.log('Movie ID type:', typeof movieId);
        
        // Ensure minimum content length - backend requires at least 10 chars
        if (content.trim().length < 10) {
          toast({
            variant: 'destructive',
            title: 'Review Too Short',
            description: 'Reviews must be at least 10 characters long',
          });
          return;
        }
        
        // Ensure we have the right data types according to schema
        const formattedMovieId = String(movieId);
        const intRating = Math.min(10, Math.max(1, Math.round(rating))); // Rating between 1-10
        const trimmedContent = content.trim();
        const boolContainsSpoilers = Boolean(containsSpoilers);
        
        // Include the tmdbId in the input if available
        const movieMetadata = tmdbId ? { tmdbId } : undefined;
        
        console.log('Creating review with values:', {
          movieId: formattedMovieId,
          rating: intRating,
          content: trimmedContent,
          containsSpoilers: boolContainsSpoilers,
          movieMetadata
        });
        
        // Try API call with explicit data types
        try {
          // Simple, clean attempt with explicit types and minimal fields
          await createReview({
            variables: {
              input: {
                movieId: formattedMovieId,
                rating: intRating,
                content: trimmedContent,
                containsSpoilers: boolContainsSpoilers,
                ...(tmdbId ? { movieMetadata: JSON.stringify({ tmdbId }) } : {})
              }
            }
          }).then(() => {
            console.log('Review submitted successfully');
          }).catch((err) => {
            // Check if this is a 'already reviewed' error
            if (err.message.includes('already reviewed')) {
              console.log('Handling already reviewed error');
              // Instead of showing an error, refresh the page component to show the existing review
              onSuccess?.();
            } else {
              throw err; // Re-throw other errors
            }
          });
        } catch (innerError) {
          console.error('Inner error details:', innerError);
          throw innerError;
        }
      } else if (mode === 'edit' && reviewId) {
        // Debug update variables
        const updateInput = {
          rating: Math.round(rating), // Ensure rating is an integer
          content,
          containsSpoilers,
        };
        console.log('Updating review with input:', updateInput);
        
        await updateReview({
          variables: {
            id: String(reviewId),
            input: updateInput,
          },
        });
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      
      // More detailed error information
      if (error.graphQLErrors) {
        console.error('GraphQL Errors:', error.graphQLErrors);
        error.graphQLErrors.forEach(err => {
          console.error('Error details:', err);
          if (err.extensions) {
            console.error('Error extensions:', err.extensions);
          }
        });
      }
      
      if (error.networkError) {
        console.error('Network Error:', error.networkError);
      }
      
      toast({
        variant: 'destructive',
        title: 'Review Submission Failed',
        description: `Error: ${error.message}`,
      });
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-destructive">Error</p>
            <p className="text-sm text-destructive/80">{error.message}</p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="rating">Your Rating</Label>
        <div 
          className="flex justify-center space-x-1 py-2"
          onMouseLeave={() => {
            setIsHoveringRating(false);
            setTempRating(0);
          }}
        >
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              id={value === 1 ? "rating" : undefined}
              className="p-1 hover:scale-110 transition-transform"
              type="button"
              onClick={() => setRating(value)}
              onMouseEnter={() => {
                setIsHoveringRating(true);
                setTempRating(value);
              }}
            >
              <Star
                className={`h-8 w-8 ${
                  value <= displayRating
                    ? 'fill-primary text-primary'
                    : 'text-muted-foreground'
                }`}
              />
            </button>
          ))}
        </div>
        <p className="text-center text-sm text-muted-foreground">
          {displayRating > 0 ? (
            <>
              {displayRating === 1 && "Poor"}
              {displayRating === 2 && "Fair"}
              {displayRating === 3 && "Good"}
              {displayRating === 4 && "Great"}
              {displayRating === 5 && "Excellent"}
            </>
          ) : (
            "Select your rating"
          )}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="review-content">Your Review</Label>
        <Textarea
          id="review-content"
          placeholder="Write your thoughts about this movie..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[120px]"
        />
        <p className="text-xs text-muted-foreground">
          {300 - content.length} characters remaining
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="spoilers"
          checked={containsSpoilers}
          onCheckedChange={(checked) => setContainsSpoilers(!!checked)}
        />
        <Label htmlFor="spoilers" className="text-sm cursor-pointer">
          This review contains spoilers
        </Label>
      </div>

      <div className="flex justify-end space-x-2 pt-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={isLoading || !rating || !content.trim()}
        >
          {isLoading ? (
            <>
              <LoadingSpinner className="mr-2" size="sm" />
              {mode === 'create' ? 'Submitting...' : 'Updating...'}
            </>
          ) : (
            mode === 'create' ? 'Submit Review' : 'Update Review'
          )}
        </Button>
      </div>
    </div>
  );
}
