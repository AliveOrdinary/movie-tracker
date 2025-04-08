// src/components/movies/MovieSidebar.tsx
import React from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ListTodo, Star, Calendar, Globe, PlusCircle } from 'lucide-react';
import { formatNumber } from '@/lib/utils/movie-utils';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { MovieActionButton } from './MovieActionButton';
import { MovieWatchHistoryCard } from '../watch-history';

interface MovieSidebarProps {
  movie: {
    id: string;
    tmdbId: number;
    title: string;
    languages: string[];
    voteCount?: number;
    isInWatchlist?: boolean;
  };
}

export function MovieSidebar({ movie }: MovieSidebarProps) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <MovieActionButton
            movie={movie}
            primaryAction="watchlist"
            fullWidth
            showPrimaryActionOnly
          />
          <MovieActionButton
            movie={movie}
            primaryAction="list"
            fullWidth
            variant="outline"
            showPrimaryActionOnly
          />
          <MovieActionButton
            movie={movie}
            primaryAction="watch"
            fullWidth
            variant="outline"
            showPrimaryActionOnly
          />
        </CardContent>
      </Card>

      {isAuthenticated && (
        <MovieWatchHistoryCard 
          movieId={movie.id} 
          movieTitle={movie.title} 
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Language</span>
              <div className="flex items-center gap-1 mt-1">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span>{movie.languages?.join(', ') || 'Unknown'}</span>
              </div>
            </div>
            
            <div className="flex flex-col mt-3">
              <span className="text-xs text-muted-foreground">Vote Count</span>
              <div className="flex items-center gap-1 mt-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{formatNumber(movie.voteCount || 0)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}