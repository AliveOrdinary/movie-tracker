// src/lib/utils/movie-utils.ts
import { GENRE_MAP } from '@/types/movie';

export function formatReleaseYear(releaseDate: string): number {
  return new Date(releaseDate).getFullYear();
}

export function formatGenres(genreIds: number[]): string[] {
  return genreIds.map(id => GENRE_MAP[id] || 'Unknown Genre');
}

export function formatRuntime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

export function formatRating(rating: number): string {
  return (rating / 2).toFixed(1);
}

export const IMAGE_SIZES = {
  poster: {
    small: 'w185',
    medium: 'w342',
    large: 'w500',
    original: 'original'
  },
  backdrop: {
    small: 'w300',
    medium: 'w780',
    large: 'w1280',
    original: 'original'
  }
} as const;

export function getTMDBImageUrl(
  path: string | null,
  type: 'poster' | 'backdrop' = 'poster',
  size: keyof typeof IMAGE_SIZES.poster = 'medium'
): string | null {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${IMAGE_SIZES[type][size]}${path}`;
}