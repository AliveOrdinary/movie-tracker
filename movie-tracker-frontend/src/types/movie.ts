// src/types/movie.ts
export interface TMDBMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  release_date: string;
  genre_ids: number[];
  adult: boolean;
  original_language: string;
}

// Genre mapping (you can expand this based on TMDB genres)
export const GENRE_MAP: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science Fiction",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western"
};

// Helper functions
export function formatReleaseYear(release_date: string): number {
  return new Date(release_date).getFullYear();
}

export function formatGenres(genre_ids: number[]): string[] {
  return genre_ids.map(id => GENRE_MAP[id] || 'Unknown Genre');
}