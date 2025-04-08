// src/components/movies/MovieHero.tsx
import React, { useState } from 'react';
import Image from 'next/image';
import { Clock, Star, Calendar } from 'lucide-react';
import { formatRuntime, getTMDBImageUrl } from '@/lib/utils/movie-utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth/AuthContext';
import { MovieActionButton } from './MovieActionButton';
import { LogWatchModal } from '@/components/watch-history/LogWatchModal';

interface MovieHeroProps {
  movie: {
    id: string;
    tmdbId: number;
    title: string;
    originalTitle: string;
    backdropPath: string | null;
    posterPath: string | null;
    releaseYear: number;
    genres: string[];
    runtime?: number;
    voteAverage?: number;
    voteCount?: number;
  };
}

export function MovieHero({ movie }: MovieHeroProps) {
  const { isAuthenticated } = useAuth();
  const backdropUrl = getTMDBImageUrl(movie.backdropPath, 'backdrop', 'large');
  const posterUrl = getTMDBImageUrl(movie.posterPath, 'poster', 'medium');
  const [watchModalOpen, setWatchModalOpen] = useState(false);

  return (
    <div className="relative">
      {/* Backdrop Image */}
      <div className="relative h-[60vh] w-full ">
        {backdropUrl ? (
          <Image
            src={backdropUrl}
            alt={movie.title}
            fill
            priority
            className="object-cover"
            style={{ objectPosition: 'top' }}
          />
        ) : (
          <div className="absolute inset-0 bg-muted" />
        )}
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4">
        <div className="relative -mt-[25vh] flex gap-8">
          {/* Poster */}
          <div className="hidden md:block relative h-[400px] w-[266px] flex-shrink-0 overflow-hidden rounded-lg shadow-lg">
            {posterUrl ? (
              <Image
                src={posterUrl}
                alt={movie.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-muted flex items-center justify-center">
                <span className="text-muted-foreground">No Image</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 text-white">
            <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
              {movie.title}
            </h1>
            {movie.originalTitle !== movie.title && (
              <p className="mt-1 text-lg text-muted-foreground">
                {movie.originalTitle}
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {movie.genres.map((genre) => (
                <Badge key={genre} variant="secondary">
                  {genre}
                </Badge>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{movie.releaseYear}</span>
              </div>
              {movie.runtime && movie.runtime > 0 && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{formatRuntime(movie.runtime)}</span>
                </div>
              )}
              {movie.voteAverage && movie.voteCount && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4" />
                  <span>
                    {(movie.voteAverage / 2).toFixed(1)}/5 ({movie.voteCount}{' '}
                    votes)
                  </span>
                </div>
              )}
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              {isAuthenticated ? (
                <>
                  <MovieActionButton 
                    movie={movie} 
                    primaryAction="watchlist"
                    size="lg"
                    showPrimaryActionOnly
                  />
                  <Button
                    onClick={() => setWatchModalOpen(true)}
                    size="lg"
                    variant="outline"
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Mark as Watched
                  </Button>
                </>
              ) : (
                <Button size="lg" variant="outline">
                  Sign in to track this movie
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Log Watch Modal */}
      <LogWatchModal
        movie={movie}
        open={watchModalOpen}
        onOpenChange={setWatchModalOpen}
        onWatchLogged={() => {
          // Could add a refresh here if needed
        }}
      />
    </div>
  );
}