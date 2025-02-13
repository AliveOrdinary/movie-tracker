// src/components/movies/MovieCard.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Clock, Star } from 'lucide-react';
import { TMDBMovie } from '@/types/movie';
import { formatReleaseYear, formatGenres } from '@/lib/utils/movie-utils';
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
  movie: TMDBMovie;
  showRating?: boolean;
  onAddToWatchlist?: (movieId: number) => void;
}

export function MovieCard({ movie, showRating = true, onAddToWatchlist }: MovieCardProps) {
  const releaseYear = formatReleaseYear(movie.release_date);
  const genres = formatGenres(movie.genre_ids);
  const rating = (movie.vote_average / 2).toFixed(1); // Convert to 5-star rating

  const handleAddToWatchlist = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onAddToWatchlist) {
      onAddToWatchlist(movie.id);
    }
  };

  return (
    <Link href={`/movies/${movie.id}`}>
      <Card className="h-full overflow-hidden transition-transform hover:scale-[1.02]">
        <CardHeader className="p-0">
          <div className="relative aspect-[2/3] w-full">
            {movie.poster_path ? (
              <Image
                src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
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
                      <p className="text-xs">({movie.vote_count} votes)</p>
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
              onClick={handleAddToWatchlist}
              title="Add to Watchlist"
            >
              <Clock className="h-4 w-4" />
            </Button>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}