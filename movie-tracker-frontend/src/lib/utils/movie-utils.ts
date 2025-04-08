/**
 * Normalize a movie ID to ensure consistent TMDB ID format
 * This function takes various movie ID formats and extracts the TMDB ID (number)
 * 
 * @param movieId The movie ID to normalize (could be string, number, or complex format)
 * @returns A normalized TMDB ID as a number
 */
export function normalizeTmdbId(movieId: string | number): number {
  console.log(`Normalizing TMDB ID: ${movieId} (type: ${typeof movieId})`);
  
  // If it's already a number, verify it's valid and return it
  if (typeof movieId === 'number') {
    if (isNaN(movieId) || !isFinite(movieId)) {
      console.error(`Invalid number movieId: ${movieId}`);
      return 0; // Invalid ID
    }
    
    // Ensure we don't have precision issues with large numbers
    // by converting to string and back
    const safeId = parseInt(movieId.toString(), 10);
    return safeId;
  }
  
  // Convert to string first to handle various input formats
  const idStr = String(movieId);
  
  // Handle movie card format: 'movie-{tmdbId}-{index}'
  if (idStr.startsWith('movie-')) {
    const segments = idStr.split('-');
    if (segments.length >= 2 && !isNaN(parseInt(segments[1], 10))) {
      return parseInt(segments[1], 10);
    }
  }
  
  // Handle TMDB prefixed format: 'tmdb-{id}'
  if (idStr.startsWith('tmdb-')) {
    const tmdbId = idStr.split('-')[1];
    if (tmdbId && !isNaN(parseInt(tmdbId, 10))) {
      return parseInt(tmdbId, 10);
    }
  }

  // If it looks like a UUID, we should NOT try to convert it to a TMDB ID
  // UUIDs are used internally for relationships and are not TMDB IDs
  if (idStr.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    console.warn(`Received a UUID (${idStr}) when expecting a TMDB ID. This is likely an internal ID and should not be used for TMDB lookups.`);
    return 0; // Return invalid ID to prevent misuse
  }
  
  // If it's a simple numeric string, parse it
  if (/^\d+$/.test(idStr)) {
    return parseInt(idStr, 10);
  }
  
  // For more complex strings, try to extract any number
  const matches = idStr.match(/\d+/);
  if (matches && matches[0]) {
    return parseInt(matches[0], 10);
  }
  
  // If all else fails, return a fallback
  console.error(`Failed to normalize movie ID: ${movieId}`);
  return 0; // Invalid ID
}
/**
 * Utility functions for working with movies
 */

/**
 * Safely normalize a movie ID to a number
 * @param movieId The movie ID to normalize (could be string, number, or other)
 * @returns A valid movie ID number or null if invalid
 */
export function normalizeMovieId(movieId: any): number | null {
  // Handle string IDs
  if (typeof movieId === 'string') {
    // Handle UUID format - extract any numeric portions that might be the TMDB ID
    if (movieId.includes('-')) {
      console.warn('Received complex ID format, attempting to extract TMDB ID:', movieId);
      return null; // Return null for UUID format as we can't reliably extract TMDB ID
    }
    
    // Try to parse as integer
    const parsed = parseInt(movieId, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
    return null;
  }
  
  // Handle number IDs
  if (typeof movieId === 'number') {
    if (!isNaN(movieId) && movieId > 0) {
      return movieId;
    }
    return null;
  }
  
  // If not string or number, return null
  return null;
}

/**
 * Get a poster URL for a movie from its path
 * @param posterPath The path to the poster
 * @param size The size of the poster image ('w92', 'w154', 'w185', 'w342', 'w500', 'w780', 'original')
 * @returns The complete poster URL or a fallback image URL
 */
export function getPosterUrl(posterPath: string | null | undefined, size: string = 'w342'): string {
  if (!posterPath) {
    return '/images/movie-placeholder.jpg';
  }
  
  // Check if posterPath already contains the base URL
  if (posterPath.startsWith('http')) {
    return posterPath;
  }
  
  // Add base URL if not already present
  return `https://image.tmdb.org/t/p/${size}${posterPath}`;
}

/**
 * Get a backdrop URL for a movie from its path
 * @param backdropPath The path to the backdrop
 * @param size The size of the backdrop image ('w300', 'w780', 'w1280', 'original')
 * @returns The complete backdrop URL or a fallback image URL
 */
export function getBackdropUrl(backdropPath: string | null | undefined, size: string = 'w780'): string {
  if (!backdropPath) {
    return '/images/backdrop-placeholder.jpg';
  }
  
  // Check if backdropPath already contains the base URL
  if (backdropPath.startsWith('http')) {
    return backdropPath;
  }
  
  // Add base URL if not already present
  return `https://image.tmdb.org/t/p/${size}${backdropPath}`;
}// Need Apollo imports at the top
import { getApolloClient } from '@/lib/apollo/client';
import { gql } from '@apollo/client';

// NOTE: We've simplified the Movie ID handling to use:
// 1. TMDB IDs (numbers) for all frontend-to-backend API calls and UI components
// 2. Internal UUIDs are only used server-side for database relationships

/**
 * Get the internal UUID for a movie using its TMDB ID
 * 
 * IMPORTANT: This function is only needed when a frontend component needs to directly access
 * the internal UUID. The backend now handles the TMDB ID to UUID mapping automatically, so
 * most frontend components should use TMDB IDs directly in mutations without calling this function.
 * 
 * Use this function when you need to:
 * 1. Directly access a Movie's internal UUID for special operations
 * 2. Check if a movie exists in the database before performing an action
 * 
 * @param tmdbId The TMDB ID of the movie
 * @returns Promise resolving to the internal UUID or null if not found
 */
export async function getMovieInternalId(tmdbId: string | number): Promise<string | null> {
  // Don't proceed if no tmdbId
  if (!tmdbId) return null;
  
  // Convert to number
  const numericTmdbId = normalizeTmdbId(tmdbId);
  
  // Check if it's a valid number
  if (numericTmdbId <= 0) {
    console.error(`Invalid TMDB ID: ${tmdbId}`);
    return null;
  }
  
  try {
    // Define the query to get movie details
    const GET_MOVIE = gql`
      query GetMovie($tmdbId: Int!) {
        movie(tmdbId: $tmdbId) {
          id
        }
      }
    `;
    
    // Get Apollo client
    const client = getApolloClient();
    
    // Execute the query
    const { data } = await client.query({
      query: GET_MOVIE,
      variables: { tmdbId: numericTmdbId },
      fetchPolicy: 'network-only' // Always go to network to ensure we get the latest data
    });
    
    // Return the internal ID if found
    if (data?.movie?.id) {
      console.log(`Found internal UUID ${data.movie.id} for TMDB ID ${numericTmdbId}`);
      return data.movie.id;
    }
    
    console.warn(`No movie found for TMDB ID ${numericTmdbId}`);
    return null;
  } catch (error) {
    console.error(`Error fetching internal ID for TMDB ID ${tmdbId}:`, error);
    return null;
  }
}

/**
 * Gets the full URL for TMDB images
 * 
 * @param path Image path from TMDB API
 * @param type Type of image (poster or backdrop)
 * @param size Size of image (small, medium, large)
 * @returns Full URL to the image
 */
export function getTMDBImageUrl(
  path: string | null | undefined,
  type: 'poster' | 'backdrop' | 'profile',
  size: 'small' | 'medium' | 'large' = 'medium'
): string | null {
  if (!path) return null;

  // If the path is already a full URL, return it
  if (path.startsWith('http')) return path;

  // Base URL for TMDB images
  const baseUrl = 'https://image.tmdb.org/t/p';

  // Size mapping
  const sizeMap = {
    poster: {
      small: 'w185',
      medium: 'w342',
      large: 'w500'
    },
    backdrop: {
      small: 'w300',
      medium: 'w780',
      large: 'w1280'
    },
    profile: {
      small: 'w45',
      medium: 'w185',
      large: 'h632'
    }
  };

  // Get the appropriate size
  const sizeStr = sizeMap[type][size];

  // Return the full URL
  return `${baseUrl}/${sizeStr}${path}`;
}

/**
 * Formats runtime in minutes to hours and minutes
 * 
 * @param minutes Runtime in minutes
 * @returns Formatted string (e.g., "2h 15m")
 */
export function formatRuntime(minutes: number): string {
  if (!minutes || minutes <= 0) return 'Unknown';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  
  return `${hours}h ${mins}m`;
}

/**
 * Format a release date to a readable string
 * 
 * @param date Release date
 * @returns Formatted date string
 */
export function formatReleaseDate(date: string | null): string {
  if (!date) return 'Unknown';
  
  try {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (e) {
    return 'Unknown';
  }
}

/**
 * Extract release year from a full date string
 * 
 * @param date Release date
 * @returns Year as number or null
 */
export function getReleaseYear(date: string | null): number | null {
  if (!date) return null;
  
  try {
    return new Date(date).getFullYear();
  } catch (e) {
    return null;
  }
}

/**
 * Format a number for display as currency
 * 
 * @param value Number to format
 * @returns Formatted currency string
 */
export function formatCurrency(value: number | null): string {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
}

/**
 * Format a number to include commas for thousands
 * 
 * @param value Number to format
 * @returns Formatted number string with commas
 */
export function formatNumber(value: number | null): string {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';
  
  return new Intl.NumberFormat('en-US').format(value);
}

/**
 * Calculate a rating percentage (for progress bars, etc)
 * 
 * @param rating Rating value (typically 0-10)
 * @param max Maximum possible rating value
 * @returns Percentage from 0-100
 */
export function getRatingPercentage(rating: number, max: number = 10): number {
  if (!rating || rating <= 0) return 0;
  return (rating / max) * 100;
}

/**
 * Convert TMDB vote average (0-10) to star rating (0-5)
 * 
 * @param voteAverage TMDB vote average (0-10)
 * @returns Star rating (0-5)
 */
export function getStarRating(voteAverage: number): number {
  if (!voteAverage || voteAverage <= 0) return 0;
  return voteAverage / 2;
}

/**
 * Get a color based on rating value (for visual indicators)
 * 
 * @param rating Rating value
 * @param max Maximum possible rating
 * @returns CSS color class or hex code
 */
export function getRatingColor(rating: number, max: number = 10): string {
  if (!rating || rating <= 0) return 'gray';
  
  const percentage = (rating / max) * 100;
  
  if (percentage >= 70) return 'emerald-500'; // Good
  if (percentage >= 50) return 'yellow-500';  // Average
  return 'red-500';  // Poor
}

/**
 * Create a query string for filtering movies
 * 
 * @param filters Object containing filter parameters
 * @returns URL query string
 */
export function createMovieFilterQuery(filters: Record<string, any>): string {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });
  
  return params.toString();
}

/**
 * Parse a query string into a filters object
 * 
 * @param query URL query string
 * @returns Object with filter parameters
 */
export function parseMovieFilterQuery(query: string): Record<string, any> {
  const params = new URLSearchParams(query);
  const filters: Record<string, any> = {};
  
  params.forEach((value, key) => {
    // Convert numeric strings to numbers
    if (/^\d+$/.test(value)) {
      filters[key] = parseInt(value, 10);
    } else if (value === 'true' || value === 'false') {
      filters[key] = value === 'true';
    } else {
      filters[key] = value;
    }
  });
  
  return filters;
}

/**
 * Check if a movie is recent (released in the last 3 months)
 * 
 * @param releaseDate Movie release date
 * @returns Boolean indicating if movie is recent
 */
export function isRecentMovie(releaseDate: string | null): boolean {
  if (!releaseDate) return false;
  
  try {
    const releaseTime = new Date(releaseDate).getTime();
    const threeMonthsAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
    
    return releaseTime > threeMonthsAgo;
  } catch (e) {
    return false;
  }
}

/**
 * Convert TMDBMovie to Movie type
 * 
 * @param tmdbMovie TMDB movie object from API
 * @returns Converted Movie object
 */
export function convertTMDBToMovie(tmdbMovie: any): any {
  if (!tmdbMovie) return null;
  
  return {
    id: tmdbMovie.id?.toString() || '',
    tmdbId: tmdbMovie.id || 0,
    title: tmdbMovie.title || '',
    originalTitle: tmdbMovie.original_title || tmdbMovie.title || '',
    overview: tmdbMovie.overview || '',
    releaseYear: getReleaseYear(tmdbMovie.release_date) || 0,
    posterPath: tmdbMovie.poster_path || null,
    posterUrl: getTMDBImageUrl(tmdbMovie.poster_path, 'poster', 'medium'),
    backdropPath: tmdbMovie.backdrop_path || null,
    backdropUrl: getTMDBImageUrl(tmdbMovie.backdrop_path, 'backdrop', 'large'),
    voteAverage: tmdbMovie.vote_average || 0,
    voteCount: tmdbMovie.vote_count || 0,
    popularity: tmdbMovie.popularity || 0,
    genres: tmdbMovie.genre_ids ? formatGenres(tmdbMovie.genre_ids) : [],
    isAdult: tmdbMovie.adult || false,
    languages: [tmdbMovie.original_language || 'en']
  };
}

/**
 * Format release year from a date string
 * 
 * @param releaseDate Release date string
 * @returns Year as a number or 'Unknown'
 */
export function formatReleaseYear(releaseDate: string | null | undefined): number | string {
  if (!releaseDate) return 'Unknown';
  
  try {
    return new Date(releaseDate).getFullYear();
  } catch (e) {
    return 'Unknown';
  }
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

/**
 * Convert genre IDs to genre names
 * 
 * @param genreIds Array of genre IDs
 * @returns Array of genre names
 */
export function formatGenres(genreIds: number[] | string[]): string[] {
  if (!genreIds || !Array.isArray(genreIds) || genreIds.length === 0) {
    return [];
  }
  
  // Check if we have genre IDs or actual genre names
  if (typeof genreIds[0] === 'number') {
    return (genreIds as number[]).map(id => GENRE_MAP[id] || 'Unknown Genre');
  }
  
  // If we already have genre names
  return genreIds as string[];
}

/**
 * Get YouTube embed URL from video key
 * 
 * @param key YouTube video key
 * @returns Full embed URL
 */
export function getYouTubeEmbedUrl(key: string): string {
  return `https://www.youtube.com/embed/${key}?rel=0&showinfo=0&autoplay=0`;
}

/**
 * Generate a caption for sharing a movie
 * 
 * @param movie Movie object
 * @returns Sharing caption
 */
export function generateShareCaption(movie: { title: string; releaseYear?: number; voteAverage?: number }): string {
  let caption = `Check out ${movie.title}`;
  
  if (movie.releaseYear) {
    caption += ` (${movie.releaseYear})`;
  }
  
  if (movie.voteAverage) {
    caption += ` - Rated ${movie.voteAverage}/10`;
  }
  
  caption += ' on CineTrack!';
  
  return caption;
}

/**
 * Get the appropriate video thumbnail URL for a movie trailer
 * 
 * @param key YouTube video key
 * @returns Thumbnail URL
 */
export function getVideoThumbnail(key: string): string {
  return `https://img.youtube.com/vi/${key}/hqdefault.jpg`;
}