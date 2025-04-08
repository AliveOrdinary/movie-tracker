'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { SEARCH_MOVIES, GET_POPULAR_MOVIES } from '@/types/graphql/movies';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Search, Plus, AlertTriangle, RefreshCw } from 'lucide-react';
import { BULK_ADD_MOVIES } from '@/types/graphql/lists';

// Define TMDBMovie interface to match the schema
interface TMDBMovie {
  id: string;
  title: string;
  original_title: string;
  overview?: string;
  poster_path?: string;
  backdrop_path?: string;
  vote_average: number;
  vote_count: number;
  release_date: string;
  genre_ids: number[];
  adult: boolean;
  original_language?: string;
  popularity?: number;
}

interface BulkMovieAdderProps {
  listId: string;
  onSuccess?: () => void;
}

export function BulkMovieAdder({ listId, onSuccess }: BulkMovieAdderProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TMDBMovie[]>([]);
  const [selectedMovies, setSelectedMovies] = useState<Set<number>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  // Minimum search length
  const minSearchLength = 2;
  
  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchQuery.length >= minSearchLength) {
        setDebouncedSearchTerm(searchQuery);
      } else {
        setDebouncedSearchTerm('');
      }
    }, 500);
    
    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery, minSearchLength]);
  
  // Search query
  const { 
    data: searchData, 
    loading: searchLoading, 
    error: searchError 
  } = useQuery(SEARCH_MOVIES, {
    variables: { query: debouncedSearchTerm, page: 1 },
    skip: !debouncedSearchTerm,
    fetchPolicy: 'network-only'
  });
  
  // Popular movies query
  const { 
    data: popularData, 
    loading: popularLoading 
  } = useQuery(GET_POPULAR_MOVIES, {
    variables: { page: 1, limit: 20 },
    skip: !!debouncedSearchTerm,
    fetchPolicy: 'cache-first'
  });
  
  // Update results when data changes
  useEffect(() => {
    if (searchData?.searchMovies && Array.isArray(searchData.searchMovies)) {
      setSearchResults(searchData.searchMovies);
    } else if (!debouncedSearchTerm && popularData?.popularMovies && Array.isArray(popularData.popularMovies)) {
      setSearchResults(popularData.popularMovies);
    }
  }, [searchData, popularData, debouncedSearchTerm]);
  
  // Bulk add mutation
  const [bulkAddMovies] = useMutation(BULK_ADD_MOVIES);
  
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const toggleMovieSelection = (movieId: number) => {
    const newSelection = new Set(selectedMovies);
    if (newSelection.has(movieId)) {
      newSelection.delete(movieId);
    } else {
      newSelection.add(movieId);
    }
    setSelectedMovies(newSelection);
  };
  
  const handleBulkAdd = async () => {
    if (selectedMovies.size === 0) {
      toast({
        title: "No movies selected",
        description: "Please select at least one movie to add"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Log the IDs being added to help with debugging
      const movieIdsArray = Array.from(selectedMovies);
      console.log('Adding movies with IDs:', movieIdsArray);
      
      // Ensure the IDs are being passed as numbers
      await bulkAddMovies({
        variables: {
          input: {
            listId,
            movieIds: movieIdsArray
          }
        }
      });
      
      toast({
        title: "Success",
        description: `Added ${selectedMovies.size} movies to your list`
      });
      
      setSelectedMovies(new Set());
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error adding movies to list:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add movies to list"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Search for movies..."
            value={searchQuery}
            onChange={handleSearchInputChange}
            className="pl-9 w-full"
          />
        </div>
        <Button 
          type="button" 
          variant="outline"
          onClick={() => setSearchQuery('')}
          disabled={!searchQuery}
        >
          Clear
        </Button>
      </div>
      
      {(searchLoading || popularLoading) ? (
        <div className="flex justify-center py-8 flex-col items-center">
          <LoadingSpinner className="mb-4" />
          <p className="text-sm text-muted-foreground">
            {searchLoading ? "Searching..." : "Loading popular movies..."}
          </p>
        </div>
      ) : searchError ? (
        <div className="flex flex-col items-center p-6 text-destructive gap-2">
          <AlertTriangle className="h-8 w-8" />
          <p className="font-medium">Error searching movies</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => {
              setDebouncedSearchTerm('');
              setTimeout(() => setDebouncedSearchTerm(searchQuery), 100);
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      ) : searchResults.length > 0 ? (
        <>
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {searchResults.length} movies found
            </p>
            <div className="flex items-center">
              <p className="text-sm text-muted-foreground mr-2">
                {selectedMovies.size} selected
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedMovies(new Set())}
                disabled={selectedMovies.size === 0}
              >
                Clear
              </Button>
            </div>
          </div>
          
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {searchResults.map((movie) => (
                <Card key={movie.id} className={`transition-colors ${selectedMovies.has(parseInt(movie.id)) ? 'border-primary' : ''}`}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <Checkbox 
                        id={`movie-${movie.id}`}
                        checked={selectedMovies.has(parseInt(movie.id))}
                        onCheckedChange={() => toggleMovieSelection(parseInt(movie.id))}
                      />
                      <div className="w-12 h-18 bg-muted flex-shrink-0 rounded overflow-hidden">
                        {movie.poster_path ? (
                          <img 
                            src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`} 
                            alt={movie.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                            No Image
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <Label 
                          htmlFor={`movie-${movie.id}`}
                          className="font-medium text-sm cursor-pointer"
                        >
                          {movie.title} (ID: {movie.id})
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {movie.release_date ? new Date(movie.release_date).getFullYear() : 'Unknown'}
                        </p>
                        <p className="text-xs line-clamp-1 mt-1">{movie.overview}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
          
          <Button
            className="w-full"
            disabled={selectedMovies.size === 0 || isSubmitting}
            onClick={handleBulkAdd}
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add {selectedMovies.size} Movies to List
              </>
            )}
          </Button>
        </>
      ) : searchQuery && searchQuery.length >= minSearchLength ? (
        <div className="text-center py-8 text-muted-foreground flex flex-col items-center">
          <div className="mb-4">
            <Search className="h-8 w-8 text-muted-foreground opacity-30" />
          </div>
          <p>No movies found matching "{searchQuery}"</p>
          <p className="text-sm mt-2">Try a different search term or check your spelling</p>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground flex flex-col items-center">
          <div className="mb-4">
            <Search className="h-10 w-10 text-muted-foreground opacity-30" />
          </div>
          <p className="text-lg font-medium mb-1">Search for movies to add to your list</p>
          <p className="text-sm">Type at least {minSearchLength} characters to search</p>
        </div>
      )}
    </div>
  );
}