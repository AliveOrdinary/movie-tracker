// src/components/movies/MovieGrid.tsx
'use client';

import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { Search, SlidersHorizontal } from 'lucide-react';
import { GET_POPULAR_MOVIES, SEARCH_MOVIES } from '@/types/graphql/movies';
import { TMDBMovie } from '@/types/movie';
import { MovieCard } from './MovieCard';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MovieGridSkeleton } from '@/components/movies/MovieGridSkeleton';
import { useToast } from '@/hooks/use-toast';

type SortOption = 'popular' | 'rating' | 'newest';

interface MovieGridProps {
  initialMovies?: TMDBMovie[];
  showSearch?: boolean;
  showFilters?: boolean;
}

export function MovieGrid({ 
  initialMovies,
  showSearch = true, 
  showFilters = true 
}: MovieGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const { toast } = useToast();

  const { data: popularData, loading: popularLoading } = useQuery(GET_POPULAR_MOVIES, {
    variables: { page: 1 },
    skip: isSearching
  });

  const { data: searchData, loading: searchLoading } = useQuery(SEARCH_MOVIES, {
    variables: { query: searchQuery, page: 1 },
    skip: !isSearching || !searchQuery
  });

  const movies = isSearching ? searchData?.searchMovies : popularData?.popularMovies || initialMovies;
  const loading = isSearching ? searchLoading : popularLoading;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearching(true);
    } else {
      setIsSearching(false);
    }
  };

  const handleAddToWatchlist = async (movieId: number) => {
    try {
      // TODO: Implement watchlist mutation
      toast({
        title: "Success",
        description: "Added to watchlist",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add to watchlist",
      });
    }
  };

  const handleSort = (option: SortOption) => {
    setSortBy(option);
    // TODO: Implement sorting logic
  };

  const sortOptions = [
    { label: 'Popular', value: 'popular' },
    { label: 'Top Rated', value: 'rating' },
    { label: 'Newest', value: 'newest' },
  ];

  return (
    <ScrollArea className="h-full">
      <div className="container mx-auto px-4 py-6">
        {(showSearch || showFilters) && (
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            {showSearch && (
              <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search movies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 max-w-xl w-full"
                  />
                </div>
                <Button type="submit">Search</Button>
              </form>
            )}

            {showFilters && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Sort
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {sortOptions.map((option) => (
                    <DropdownMenuItem 
                      key={option.value}
                      onClick={() => handleSort(option.value as SortOption)}
                      className={sortBy === option.value ? 'bg-accent' : ''}
                    >
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}

        {loading ? (
          <MovieGridSkeleton />
        ) : movies?.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {movies.map((movie: TMDBMovie, index: number) => (
              <MovieCard
              key={`${movie.id}-${index}`}
                movie={movie}
                onAddToWatchlist={handleAddToWatchlist}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {isSearching ? 'No movies found' : 'No movies available'}
            </p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}