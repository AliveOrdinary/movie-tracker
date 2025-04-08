'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getTMDBImageUrl } from '@/lib/utils/movie-utils';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useQuery } from '@apollo/client';
import { GET_MOVIE_IMAGES } from '@/types/graphql/movies';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface MovieImages {
  posterPath: string | null;
  backdropPath: string | null;
}

interface MovieGalleryProps {
  movieId: string;
  tmdbId: number;
}

export function MovieGallery({ movieId, tmdbId }: MovieGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Debug log
  console.log('MovieGallery render:', { movieId, tmdbId });

  const { loading, data, error } = useQuery(GET_MOVIE_IMAGES, {
    variables: { tmdbId },
    skip: !tmdbId,
    onError: (error) => {
      // console.error('Movie images query error:', error?.message);
    }
  });

  // Debug log
  console.log('Query result:', { loading, data, error });

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (!data?.movie) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No images available
      </div>
    );
  }

  const { posterPath, backdropPath } = data.movie;

  if (!posterPath && !backdropPath) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No images available for this movie
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {backdropPath && (
        <div>
          <h3 className="font-medium mb-4">Backdrop</h3>
          <ScrollArea className="w-full whitespace-nowrap rounded-md border">
            <div className="flex w-max space-x-4 p-4">
              <Dialog>
                <DialogTrigger asChild>
                  <button
                    className="overflow-hidden rounded-md"
                    onClick={() => setSelectedImage(backdropPath)}
                  >
                    <Image
                      src={getTMDBImageUrl(backdropPath, 'backdrop', 'small') || '/placeholder-backdrop.jpg'}
                      alt="Movie backdrop"
                      width={300}
                      height={169}
                      className="object-cover transition-transform hover:scale-105"
                      priority
                    />
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-6xl">
                  <div className="relative aspect-video w-full">
                    <Image
                      src={getTMDBImageUrl(selectedImage, 'backdrop', 'original') || '/placeholder-backdrop.jpg'}
                      alt="Movie backdrop"
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </ScrollArea>
        </div>
      )}

      {posterPath && (
        <div>
          <h3 className="font-medium mb-4">Poster</h3>
          <ScrollArea className="w-full whitespace-nowrap rounded-md border">
            <div className="flex w-max space-x-4 p-4">
              <Dialog>
                <DialogTrigger asChild>
                  <button
                    className="overflow-hidden rounded-md"
                    onClick={() => setSelectedImage(posterPath)}
                  >
                    <Image
                      src={getTMDBImageUrl(posterPath, 'poster', 'small') || '/placeholder-poster.jpg'}
                      alt="Movie poster"
                      width={154}
                      height={231}
                      className="object-cover transition-transform hover:scale-105"
                      priority
                    />
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <div className="relative aspect-[2/3] w-full">
                    <Image
                      src={getTMDBImageUrl(selectedImage, 'poster', 'original') || '/placeholder-poster.jpg'}
                      alt="Movie poster"
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}