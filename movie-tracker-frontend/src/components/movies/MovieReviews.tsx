// src/components/movies/MovieReviews.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useQuery } from '@apollo/client';
import { PenSquare } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { GET_MOVIE_REVIEWS } from '@/types/graphql/movies';
import { ReviewList } from '@/components/reviews/ReviewList';
import { ReviewEditor } from '@/components/reviews/ReviewEditor';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { normalizeMovieId, normalizeTmdbId } from '@/lib/utils/movie-utils';

interface MovieReviewsProps {
  movieId: string;
  className?: string;
}

export function MovieReviews({ movieId, className }: MovieReviewsProps) {
  const { user } = useAuth();
  const [showReviewDialog, setShowReviewDialog] = useState(false);

  // Query to check if user has already reviewed
  const { loading, data, refetch, error } = useQuery(GET_MOVIE_REVIEWS, {
    variables: { 
      movieId,
      filters: {
        limit: 20, // Increase the limit to make sure we get all reviews
      } 
    },
    fetchPolicy: 'network-only', // Always fetch from network to get latest reviews
    onError: (err) => {
      console.error('Error fetching movie reviews:', err);
    }
  });

  // Check if the current user has already reviewed this movie
  const userReview = data?.movieReviews?.find(
    (review: any) => review.user.id === user?.id
  );

  const hasUserReviewed = !!userReview;

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Reviews</h2>
        {user && !hasUserReviewed && (
          <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <PenSquare className="h-4 w-4" />
                Write a Review
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Write a Review</DialogTitle>
                <DialogDescription>
                  Share your thoughts about this movie with others.
                </DialogDescription>
              </DialogHeader>
              <ReviewEditor
                movieId={movieId}
                tmdbId={normalizeTmdbId(movieId)}
                onSuccess={() => {
                  setShowReviewDialog(false);
                  refetch();
                }}
                onCancel={() => setShowReviewDialog(false)}
              />
            </DialogContent>
          </Dialog>
        )}
        
        {user && hasUserReviewed && loading && (
          <LoadingSpinner size="sm" />
        )}
        
        {user && hasUserReviewed && userReview && (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <PenSquare className="h-4 w-4" />
                Edit Your Review
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Edit Your Review</DialogTitle>
                <DialogDescription>
                  Make changes to your review of this movie.
                </DialogDescription>
              </DialogHeader>
              <ReviewEditor
                reviewId={userReview.id}
                movieId={movieId}
                tmdbId={normalizeTmdbId(movieId)}
                initialRating={userReview.rating}
                initialContent={userReview.content}
                initialContainsSpoilers={userReview.containsSpoilers}
                mode="edit"
                onSuccess={() => {
                  refetch();
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <ReviewList 
        movieId={movieId} 
        showAddReview={false}
      />
    </div>
  );
}
