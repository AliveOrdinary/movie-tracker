// src/components/movies/MovieCard.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Clock, Star } from 'lucide-react';
import { TMDBMovie, Movie } from '@/types/movie';
import { MovieCardWatchButton } from '@/components/watch-history';
import { formatReleaseYear, formatGenres, getTMDBImageUrl } from '@/lib/utils/movie-utils';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MovieCardProps {
  movie: TMDBMovie | Movie;
  showRating?: boolean;
  onAddToWatchlist?: (movieId: number) => void;
}

export function MovieCard({ movie, showRating = true, onAddToWatchlist }: MovieCardProps) {
  // Get common fields with fallbacks
  const tmdbId = (movie as any).tmdbId || parseInt((movie as any).id) || 0;
  
  // For route navigation, always use the tmdbId directly
  const movieId = tmdbId;
  
  const releaseYear = (movie as any).releaseYear || 
                      ((movie as any).release_date ? formatReleaseYear((movie as any).release_date) : 0);
  
  const genres = (movie as any).genres || 
                 ((movie as any).genre_ids ? formatGenres((movie as any).genre_ids) : []);
  
  const rating = (movie as any).voteAverage ? 
                 ((movie as any).voteAverage / 2).toFixed(1) : 
                 ((movie as any).vote_average ? ((movie as any).vote_average / 2).toFixed(1) : '0.0');
  
  const voteCount = (movie as any).voteCount || (movie as any).vote_count || 0;
  
  // Get poster path based on movie type
  const posterPath = (movie as any).posterPath || (movie as any).poster_path;

  const posterUrl = posterPath 
    ? getTMDBImageUrl(posterPath, 'poster', 'medium') 
    : null;

  return (
    <Link href={`/movies/${movieId}`} passHref legacyBehavior>
      <a className="block h-full">
        <Card className="h-full overflow-hidden transition-transform hover:scale-[1.02]">
          <CardHeader className="p-0">
            <div className="relative aspect-[2/3] w-full">
              {posterUrl ? (
                <Image
                  src={posterUrl}
                  alt={movie.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover rounded-t-lg"
                  priority={false}
                />
              ) : (
                <div className="absolute inset-0 bg-muted flex items-center justify-center rounded-t-lg">
                  <span className="text-muted-foreground">No Image</span>
                </div>
              )}
              <div className="absolute top-2 right-2 flex flex-col gap-2">
                <Badge variant="secondary" className="bg-black/75">
                  {releaseYear}
                </Badge>
                {showRating && Number(rating) > 0 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="secondary" className="bg-black/75 flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          {rating}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Rating: {rating}/5</p>
                        <p className="text-xs">({voteCount} votes)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-grow p-4">
            <CardTitle className="line-clamp-1">
              {movie.title}
            </CardTitle>
            <div className="flex flex-wrap gap-1 my-2">
              {genres.slice(0, 3).map((genre) => (
                <Badge key={genre} variant="outline" className="text-xs">
                  {genre}
                </Badge>
              ))}
            </div>
            <CardDescription className="line-clamp-2">
              {movie.overview}
            </CardDescription>
          </CardContent>
          <CardFooter className="p-4 pt-0 flex gap-2">
            <Button variant="default" className="w-full">
              View Details
            </Button>
            {onAddToWatchlist && (
              <Button 
                variant="outline" 
                size="icon"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onAddToWatchlist(movieId);
                }}
                title="Add to Watchlist"
              >
                <Clock className="h-4 w-4" />
              </Button>
            )}
            <MovieCardWatchButton movieId={movieId.toString()} />
          </CardFooter>
        </Card>
      </a>
    </Link>
  );
}