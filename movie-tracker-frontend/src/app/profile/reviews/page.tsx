// src/app/profile/reviews/page.tsx
'use client';

import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { GET_USER_REVIEWS } from '@/types/graphql/reviews';
import { ReviewItem } from '@/components/reviews';
import { Button } from '@/components/ui/button';
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
  TabsTrigger,
} from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function UserReviewsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt:desc');

  // Parse sort option
  const [sortField, sortDirection] = sortBy.split(':');

  // Build filters based on active tab
  const getFilters = () => {
    const baseFilters = {
      sortBy: sortField,
      sortDirection: sortDirection.toUpperCase(),
      includePrivate: true,
    };

    switch (activeTab) {
      case 'pending':
        return { ...baseFilters, status: 'PENDING' };
      case 'approved':
        return { ...baseFilters, status: 'APPROVED' };
      case 'flagged':
        return { ...baseFilters, status: 'FLAGGED' };
      default:
        return baseFilters;
    }
  };

  // Fetch user reviews
  const { loading, error, data, refetch } = useQuery(GET_USER_REVIEWS, {
    variables: { filters: getFilters() },
    skip: !user,
    fetchPolicy: 'cache-and-network',
  });

  const [isRetrying, setIsRetrying] = useState(false);

  // Handle retry
  const handleRetry = () => {
    setIsRetrying(true);
    refetch()
      .then(() => setIsRetrying(false))
      .catch(() => setIsRetrying(false));
  };

  // Redirect if not authenticated
  if (!authLoading && !user) {
    router.push('/auth/login');
    return null;
  }

  // Get reviews from query
  const reviews = data?.myReviews || [];

  // Render loading state
  if (authLoading || (loading && !data)) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center p-8 text-center border rounded-md">
          <AlertTriangle className="h-10 w-10 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Reviews</h2>
          <p className="text-muted-foreground mb-4">{error.message}</p>
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
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Reviews</h1>
        <p className="text-muted-foreground">Manage and view all your movie reviews.</p>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full sm:w-auto"
        >
          <TabsList className="grid grid-cols-4 w-full sm:w-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="flagged">Flagged</TabsTrigger>
          </TabsList>
        </Tabs>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt:desc">Most Recent</SelectItem>
            <SelectItem value="createdAt:asc">Oldest First</SelectItem>
            <SelectItem value="rating:desc">Highest Rating</SelectItem>
            <SelectItem value="rating:asc">Lowest Rating</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {reviews.length === 0 ? (
        <div className="text-center p-12 border rounded-md bg-muted/5">
          <h3 className="text-lg font-medium mb-2">No reviews found</h3>
          <p className="text-muted-foreground mb-6">
            {activeTab === 'all'
              ? "You haven't written any reviews yet."
              : `You don't have any ${activeTab} reviews.`}
          </p>
          <Button onClick={() => router.push('/movies')}>
            Browse Movies to Review
          </Button>
        </div>
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
