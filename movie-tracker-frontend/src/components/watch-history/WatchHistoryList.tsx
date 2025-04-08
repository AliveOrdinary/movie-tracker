import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useQuery } from '@apollo/client';
import { GET_WATCH_HISTORY } from './watch-history-operations';
import { WatchHistoryItem } from './WatchHistoryItem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  SlidersHorizontal, 
  X 
} from 'lucide-react';

type SortOption = {
  value: string;
  label: string;
  direction: 'ASC' | 'DESC';
};

const sortOptions: SortOption[] = [
  { value: 'watchedAt-DESC', label: 'Recently Watched', direction: 'DESC' },
  { value: 'watchedAt-ASC', label: 'Oldest First', direction: 'ASC' },
  { value: 'rating-DESC', label: 'Highest Rated', direction: 'DESC' },
  { value: 'rating-ASC', label: 'Lowest Rated', direction: 'ASC' },
];

export function WatchHistoryList() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSort, setSelectedSort] = useState<string>(sortOptions[0].value);
  const [showFilters, setShowFilters] = useState(false);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [selectedWatchType, setSelectedWatchType] = useState<string | null>(null);
  const [includePrivate, setIncludePrivate] = useState(true);

  // Parse selected sort option
  const [sortBy, sortDirection] = selectedSort.split('-');

  // Create filters object for query
  const filters = {
    page,
    limit,
    searchTerm: searchTerm || undefined,
    sortBy,
    sortDirection,
    onlyFavorites,
    watchType: selectedWatchType as any || undefined,
    includePrivate,
  };

  const { loading, error, data, refetch } = useQuery(GET_WATCH_HISTORY, {
    variables: { filters, limit, page },
    fetchPolicy: 'cache-and-network',
    onCompleted: (data) => {
      console.log('Watch history data successfully loaded:', data);
    },
    onError: (error) => {
      console.error('Error fetching watch history:', error);
    }
  });

  // Refetch when filters change
  useEffect(() => {
    refetch({ filters, limit, page });
  }, [filters, limit, page, refetch]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedSort, onlyFavorites, selectedWatchType, includePrivate]);

  // Get watches data from query result
  const watches = data?.watchHistory || [];
  
  // Calculate total pages
  const totalItems = watches.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));

  // Handle pagination
  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  // Render loading skeletons
  if (loading && !data) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="flex items-start gap-4 p-4 border rounded-md">
            <Skeleton className="h-20 w-14 rounded-md" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-full max-w-xs" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-full max-w-md" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded-md text-red-800">
        <p>Error loading watch history: {error.message}</p>
        <Button 
          variant="outline" 
          onClick={() => refetch()} 
          className="mt-2"
        >
          Retry
        </Button>
      </div>
    );
  }

  // Handle empty state
  if (watches.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium mb-2">No watch history found</h3>
        {searchTerm || onlyFavorites || selectedWatchType ? (
          <p className="text-muted-foreground mb-4">
            Try adjusting your filters or search criteria
          </p>
        ) : (
          <p className="text-muted-foreground mb-4">
            Start tracking your movie watches to build your history
          </p>
        )}
        <Button variant="outline" onClick={() => window.location.href = '/watch-history/add'}>
          Log a Watch
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and filter controls */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search movies..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1.5 h-7 w-7 p-0"
              onClick={() => setSearchTerm('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <div className="flex gap-2">
          <Select
            value={selectedSort}
            onValueChange={setSelectedSort}
          >
            <SelectTrigger className="w-[180px]">
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
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? "bg-muted" : ""}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Expanded filters */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-md bg-muted/20">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="favorites"
              checked={onlyFavorites}
              onCheckedChange={(checked) => setOnlyFavorites(checked as boolean)}
            />
            <Label htmlFor="favorites">Favorites only</Label>
          </div>
          
          <div>
            <Label htmlFor="watchType">Watch Type</Label>
            <Select
              value={selectedWatchType || ''}
              onValueChange={(value) => setSelectedWatchType(value || null)}
            >
              <SelectTrigger id="watchType">
                <SelectValue placeholder="All watch types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All watch types</SelectItem>
                <SelectItem value="FIRST_TIME">First Time</SelectItem>
                <SelectItem value="REWATCH">Rewatch</SelectItem>
                <SelectItem value="PARTIAL">Partial</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="includePrivate"
              checked={includePrivate}
              onCheckedChange={(checked) => setIncludePrivate(checked as boolean)}
            />
            <Label htmlFor="includePrivate">Include private watches</Label>
          </div>

          <Button
            variant="outline"
            className="col-span-full"
            onClick={() => {
              setOnlyFavorites(false);
              setSelectedWatchType(null);
              setIncludePrivate(true);
              setSearchTerm('');
              setSelectedSort(sortOptions[0].value);
            }}
          >
            Reset Filters
          </Button>
        </div>
      )}
      
      {/* Watch history list */}
      <div className="space-y-4 mt-4">
        {watches.map((watch) => (
          <WatchHistoryItem key={watch.id} watch={watch} onUpdate={() => refetch()} />
        ))}
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-muted-foreground">
            Showing {(page - 1) * limit + 1}-
            {Math.min(page * limit, totalItems)} of {totalItems} items
          </div>
          
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="px-4 py-2 text-sm">
              Page {page} of {totalPages}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={page >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
