// src/app/reviews/page.tsx
'use client';

import { useState } from 'react';
import { useQuery, gql } from '@apollo/client';
import { Star, Filter, RefreshCw, AlertTriangle, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReviewItem } from '@/components/reviews';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
} from '@/components/ui/select';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

// GraphQL query to get a list of reviews
const GET_REVIEWS = gql`
  query GetReviews($filters: MovieReviewFilters) {
    reviews(filters: $filters) {
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

export default function AllReviewsPage() {
  const [activeTab, setActiveTab] = useState('recent');
  const [sortBy, setSortBy] = useState('createdAt:desc');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showSpoilers, setShowSpoilers] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // Parse sort option
  const [sortField, sortDirection] = sortBy.split(':');

  // Build filters based on active tab and other filter settings
  const getFilters = () => {
    const baseFilters = {
      sortBy: sortField,
      sortDirection: sortDirection.toUpperCase(),
      showSpoilers,
      searchTerm: searchTerm || undefined,
      limit: 20,
    };

    // Add rating filter if specified
    if (ratingFilter !== 'all') {
      const rating = parseInt(ratingFilter, 10);
      if (!isNaN(rating)) {
        if (rating === 5) {
          baseFilters.minRating = rating;
          baseFilters.maxRating = rating;
        } else {
          baseFilters.minRating = rating;
          baseFilters.maxRating = rating;
        }
      }
    }

    // Apply additional filters based on tab
    switch (activeTab) {
      case 'verified':
        return { ...baseFilters, onlyVerifiedWatches: true };
      case 'trending':
        return { 
          ...baseFilters, 
          sortBy: 'reactionCount', 
          sortDirection: 'DESC' 
        };
      default:
        return baseFilters;
    }
  };

  // Fetch reviews
  const { loading, error, data, refetch } = useQuery(GET_REVIEWS, {
    variables: { filters: getFilters() },
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });

  // Get reviews from data
  const reviews = data?.reviews || [];

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
        <Card>
          <CardContent className="pt-6 flex flex-col items-center">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <CardTitle className="mb-2">Error Loading Reviews</CardTitle>
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Movie Reviews</h1>
        <p className="text-muted-foreground">Discover what others think about movies.</p>
      </div>

      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="w-full sm:w-auto"
          >
            <TabsList className="grid grid-cols-3 w-full sm:w-auto">
              <TabsTrigger value="recent">Recent</TabsTrigger>
              <TabsTrigger value="trending">Trending</TabsTrigger>
              <TabsTrigger value="verified">Verified</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt:desc">Most Recent</SelectItem>
                <SelectItem value="createdAt:asc">Oldest First</SelectItem>
                <SelectItem value="rating:desc">Highest Rating</SelectItem>
                <SelectItem value="rating:asc">Lowest Rating</SelectItem>
                <SelectItem value="helpfulVotes:desc">Most Helpful</SelectItem>
                <SelectItem value="reactionCount:desc">Most Reactions</SelectItem>
              </SelectContent>
            </Select>
            
            <Popover open={showFilters} onOpenChange={setShowFilters}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  className={showFilters ? "bg-muted" : ""}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <h3 className="font-medium">Filter Reviews</h3>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Rating</label>
                    <Select value={ratingFilter} onValueChange={setRatingFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by rating" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Ratings</SelectItem>
                        <SelectItem value="5">
                          <div className="flex items-center">
                            <span>5 Stars</span>
                            <div className="flex ml-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star key={star} className="h-3 w-3 fill-primary text-primary inline" />
                              ))}
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="4">
                          <div className="flex items-center">
                            <span>4 Stars</span>
                            <div className="flex ml-2">
                              {[1, 2, 3, 4].map((star) => (
                                <Star key={star} className="h-3 w-3 fill-primary text-primary inline" />
                              ))}
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="3">
                          <div className="flex items-center">
                            <span>3 Stars</span>
                            <div className="flex ml-2">
                              {[1, 2, 3].map((star) => (
                                <Star key={star} className="h-3 w-3 fill-primary text-primary inline" />
                              ))}
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="2">
                          <div className="flex items-center">
                            <span>2 Stars</span>
                            <div className="flex ml-2">
                              {[1, 2].map((star) => (
                                <Star key={star} className="h-3 w-3 fill-primary text-primary inline" />
                              ))}
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="1">
                          <div className="flex items-center">
                            <span>1 Star</span>
                            <div className="flex ml-2">
                              <Star className="h-3 w-3 fill-primary text-primary inline" />
                            </div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="show-spoilers"
                      checked={showSpoilers}
                      onChange={(e) => setShowSpoilers(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <label htmlFor="show-spoilers" className="text-sm">
                      Show spoilers
                    </label>
                  </div>
                  
                  <Button 
                    className="w-full"
                    onClick={() => setShowFilters(false)}
                  >
                    Apply Filters
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <div className="relative">
          <Input
            placeholder="Search reviews..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <Filter className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {reviews.length === 0 ? (
        <Card>
          <CardContent className="pt-6 flex flex-col items-center py-12">
            <CardTitle className="mb-2">No Reviews Found</CardTitle>
            <CardDescription className="text-center max-w-md mb-4">
              {searchTerm
                ? "No reviews match your search criteria. Try adjusting your filters or search terms."
                : "There are no reviews available at the moment."}
            </CardDescription>
            {searchTerm && (
              <Button onClick={() => setSearchTerm('')}>
                Clear Search
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <ReviewItem
              key={review.id}
              review={review}
              onUpdate={() => refetch()}
              showMovieInfo={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}
