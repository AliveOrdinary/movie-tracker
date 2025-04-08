// src/components/reviews/ReviewList.tsx
'use client';

import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { SlidersHorizontal, RefreshCw, AlertTriangle, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/lib/auth/AuthContext';
import { ReviewItem } from './ReviewItem';
import { GET_MOVIE_REVIEWS } from '@/types/graphql/movies';
import { Review } from '@/types/graphql/reviews';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ReviewListProps {
  movieId: string;
  showAddReview?: boolean;
  limit?: number;
  simplifiedView?: boolean;
}

type SortOption = {
  value: string;
  label: string;
};

const sortOptions: SortOption[] = [
  { value: 'createdAt:desc', label: 'Most Recent' },
  { value: 'createdAt:asc', label: 'Oldest First' },
  { value: 'rating:desc', label: 'Highest Rated' },
  { value: 'rating:asc', label: 'Lowest Rated' },
  { value: 'reactionCount:desc', label: 'Most Reactions' },
];

export function ReviewList({ 
  movieId, 
  showAddReview = true,
  limit = 10,
  simplifiedView = false
}: ReviewListProps) {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [selectedSort, setSelectedSort] = useState(sortOptions[0].value);
  const [showSpoilers, setShowSpoilers] = useState(false);
  const [showFiltersPopover, setShowFiltersPopover] = useState(false);

  // Parse sort option
  const [sortBy, sortDirection] = selectedSort.split(':');

  // Prepare filter variables
  const filters = {
    showSpoilers,
    sortBy,
    page,
    limit,
  };

  // Fetch reviews
  const { loading, error, data, refetch } = useQuery(GET_MOVIE_REVIEWS, {
    variables: { movieId, filters },
    fetchPolicy: 'network-only', // Always fetch from network to ensure up-to-date data
    notifyOnNetworkStatusChange: true,
    onError: (err) => {
      console.error('Error fetching movie reviews:', err);
    }
  });

  const [isRetrying, setIsRetrying] = useState(false);

  // Handle retry
  const handleRetry = () => {
    setIsRetrying(true);
    refetch()
      .then(() => setIsRetrying(false))
      .catch(() => setIsRetrying(false));
  };

  // Get reviews from query
  const reviews = data?.movieReviews || [];

  // Check if the current user has already reviewed this movie
  const hasUserReviewed = user && reviews.some((review: Review) => review.user.id === user.id);

  // Handle loading state
  if (loading && !data) {
    return (
      <div className="flex justify-center p-6">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center border rounded-md">
        <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
        <p className="font-semibold">Error loading reviews</p>
        <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
        <Button
          variant="outline"
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
      </div>
    );
  }

  // Handle empty state
  if (reviews.length === 0) {
    return (
      <div className="text-center p-8 border rounded-md">
        <h3 className="text-lg font-medium mb-2">No reviews yet</h3>
        <p className="text-muted-foreground mb-6">
          {user
            ? "Be the first to share your thoughts!"
            : "Sign in to be the first to review this movie."}
        </p>
        
        {showAddReview && user && !hasUserReviewed && (
          <Button onClick={() => alert('Open review dialog')}>
            Write a Review
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter controls */}
      <div className="flex flex-wrap justify-between items-center gap-2">
        <h2 className="text-2xl font-semibold">
          Reviews {reviews.length > 0 && `(${reviews.length})`}
        </h2>
        
        <div className="flex items-center gap-2">
          <Select 
            value={selectedSort} 
            onValueChange={setSelectedSort}
          >
            <SelectTrigger className="w-[140px] md:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Popover open={showFiltersPopover} onOpenChange={setShowFiltersPopover}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="icon"
                className={showFiltersPopover ? "bg-muted" : ""}
              >
                <Filter className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="end">
              <div className="space-y-4">
                <h3 className="font-medium">Review Filters</h3>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="show-spoilers" 
                    checked={showSpoilers}
                    onCheckedChange={(checked) => setShowSpoilers(!!checked)}
                  />
                  <Label htmlFor="show-spoilers">Show spoilers</Label>
                </div>
                
                <Button 
                  size="sm" 
                  className="w-full"
                  onClick={() => setShowFiltersPopover(false)}
                >
                  Apply Filters
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      {/* Review list */}
      <div className="space-y-4">
        {reviews.map((review: Review) => (
          <ReviewItem 
            key={review.id} 
            review={review} 
            onUpdate={() => refetch()}
            simplifiedView={simplifiedView}
          />
        ))}
      </div>
    </div>
  );
}
