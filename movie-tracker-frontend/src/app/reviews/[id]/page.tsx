// src/app/reviews/[id]/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, gql } from '@apollo/client';
import { useEffect, useState } from 'react';
import { ArrowLeft, Film, Calendar, Star, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReviewItem } from '@/components/reviews';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatDistanceToNow } from 'date-fns';

// GraphQL query to get a single review by ID
const GET_REVIEW = gql`
  query GetReview($id: String!) {
    review(id: $id) {
      id
      content
      rating
      createdAt
      helpfulVotes
      status
      containsSpoilers
      isEdited
      reactionCount
      reactionStats {
        type
        count
      }
      userReaction
      user {
        id
        username
        avatarUrl
      }
      movie {
        id
        tmdbId
        title
        posterPath
        genres
        releaseYear
      }
    }
  }
`;

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const reviewId = params.id as string;
  const [isRetrying, setIsRetrying] = useState(false);

  const { loading, error, data, refetch } = useQuery(GET_REVIEW, {
    variables: { id: reviewId },
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });

  // Safely access the review from query results
  const review = data?.review;

  // Handle retry
  const handleRetry = () => {
    setIsRetrying(true);
    refetch()
      .then(() => setIsRetrying(false))
      .catch(() => setIsRetrying(false));
  };

  if (loading && !data) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.back()}
            className="gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
        
        <Card className="max-w-3xl mx-auto">
          <CardContent className="pt-6 flex flex-col items-center">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <CardTitle className="mb-2">Error Loading Review</CardTitle>
            <p className="text-muted-foreground mb-4 text-center max-w-md">
              {error.message}
            </p>
            <Button 
              onClick={handleRetry}
              disabled={isRetrying}
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.back()}
            className="gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
        
        <Card className="max-w-3xl mx-auto">
          <CardContent className="pt-6 flex flex-col items-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="mb-2">Review Not Found</CardTitle>
            <p className="text-muted-foreground mb-4 text-center">
              The review you are looking for does not exist or has been removed.
            </p>
            <Button 
              onClick={() => router.push('/movies')}
            >
              Browse Movies
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => router.back()}
          className="gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>
      
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="text-2xl font-bold">
                {review.movie.title}
              </CardTitle>
              <Button 
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => router.push(`/movies/${review.movie.tmdbId}`)}
              >
                <Film className="h-4 w-4" />
                View Movie
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{review.movie.releaseYear}</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-primary text-primary" />
                <span>{review.rating}/5</span>
              </div>
              <div>
                <span>{review.movie.genres?.join(', ')}</span>
              </div>
            </div>
          </CardHeader>
        </Card>
        
        <ReviewItem 
          review={review} 
          onUpdate={() => refetch()}
        />
        
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Reviewed {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}</p>
        </div>
      </div>
    </div>
  );
}
