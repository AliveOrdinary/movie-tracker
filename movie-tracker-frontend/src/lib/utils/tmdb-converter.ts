/**
 * Utility functions to help with TMDB ID conversions
 */

import { normalizeTmdbId } from './movie-utils';

/**
 * Extract TMDB ID from a movie route path or ID string
 * @param pathOrId A route path or ID string potentially containing a TMDB ID
 * @returns The TMDB ID as a number, or 0 if invalid
 */
export function extractTmdbId(pathOrId: string): number {
  // If it's a simple numeric string, normalize and return
  if (/^\d+$/.test(pathOrId)) {
    return normalizeTmdbId(pathOrId);
  }
  
  // Handle /movies/123 route pattern
  if (pathOrId.startsWith('/movies/')) {
    const segments = pathOrId.split('/');
    const idSegment = segments[segments.length - 1];
    
    // Check if we have an ID segment that's numeric
    if (idSegment && /^\d+$/.test(idSegment)) {
      return normalizeTmdbId(idSegment);
    }
  }
  
  // Handle /browse/movie/123 route pattern
  if (pathOrId.includes('/movie/')) {
    const segments = pathOrId.split('/movie/');
    const idSegment = segments[segments.length - 1];
    
    // Check if we have an ID segment that's numeric
    if (idSegment && /^\d+$/.test(idSegment)) {
      return normalizeTmdbId(idSegment);
    }
  }
  
  // Handle movie-123 pattern
  const movieIdMatch = pathOrId.match(/movie-(\d+)/);
  if (movieIdMatch && movieIdMatch[1]) {
    return normalizeTmdbId(movieIdMatch[1]);
  }
  
  // If we can't determine the ID, return 0 as an invalid ID marker
  return 0;
}

/**
 * Check if a string or number is a valid TMDB ID
 * @param id The potential TMDB ID to check
 * @returns True if it's a valid TMDB ID, false otherwise
 */
export function isValidTmdbId(id: string | number): boolean {
  // Convert to number if it's a string
  const numId = typeof id === 'string' ? parseInt(id, 10) : id;
  
  // TMDB IDs are positive integers
  return !isNaN(numId) && numId > 0;
}

/**
 * Extract movie information from a ListItem
 * @param item A ListItem potentially containing movie information
 * @returns An object with the TMDB ID and title if available
 */
export function extractMovieInfo(item: any): { tmdbId: number; title: string } | null {
  // First try to get direct movie data
  if (item?.movie) {
    const tmdbId = item.movie.tmdbId || 0;
    const title = item.movie.title || 'Unknown Movie';
    
    if (tmdbId > 0) {
      return { tmdbId, title };
    }
  }
  
  // Try to get TMDB ID directly from the item if movie object isn't available
  // This is for backwards compatibility with older data structure
  if (item?.tmdbId && typeof item.tmdbId === 'number' && item.tmdbId > 0) {
    return {
      tmdbId: item.tmdbId,
      title: item.title || 'Unknown Movie'
    };
  }
  
  return null;
}
