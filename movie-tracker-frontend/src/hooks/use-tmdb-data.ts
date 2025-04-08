// src/hooks/use-tmdb-data.ts

import { useState, useEffect } from 'react';
import { TMDBService } from '@/lib/tmdb-service';
import { MovieCredits, MovieWatchProviders } from '@/types/movie';

interface TMDBData {
  credits: MovieCredits | null;
  watchProviders: MovieWatchProviders | null;
  isLoading: boolean;
  error: string | null;
}

export function useTMDBData(tmdbId: number): TMDBData {
  const [data, setData] = useState<TMDBData>({
    credits: null,
    watchProviders: null,
    isLoading: true,
    error: null
  });
  
  useEffect(() => {
    let isMounted = true;
    
    async function fetchData() {
      try {
        if (!tmdbId) return;
        
        // Start loading
        if (isMounted) {
          setData(prev => ({
            ...prev,
            isLoading: true,
            error: null
          }));
        }
        
        // Fetch both credits and watch providers in parallel
        const [credits, watchProviders] = await Promise.all([
          TMDBService.getMovieCredits(tmdbId),
          TMDBService.getMovieWatchProviders(tmdbId)
        ]);
        
        if (isMounted) {
          setData({
            credits,
            watchProviders,
            isLoading: false,
            error: null
          });
        }
      } catch (error) {
        console.error("Error fetching TMDB data:", error);
        if (isMounted) {
          setData({
            credits: null, 
            watchProviders: null,
            isLoading: false,
            error: error instanceof Error ? error.message : "Unknown error fetching movie data"
          });
        }
      }
    }
    
    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, [tmdbId]);
  
  return data;
}