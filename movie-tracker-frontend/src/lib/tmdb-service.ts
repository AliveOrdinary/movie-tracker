// src/lib/tmdb-service.ts

import { MovieCredits, MovieWatchProviders } from "@/types/movie";

// This would normally come from environment variables
const TMDB_API_KEY = 'YOUR_API_KEY_HERE';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

/**
 * Service to fetch data directly from TMDB API
 * Used for data that's not available in our backend
 */
export class TMDBService {
  
  /**
   * Fetch movie credits (cast & crew)
   */
  static async getMovieCredits(movieId: number): Promise<MovieCredits | null> {
    try {
      // In a real app, this would use the TMDB API key
      // For now, we'll return mock data for demonstration
      
      // Simulating API call
      console.log(`[TMDBService] Getting credits for movie ${movieId}`);
      
      // Mock data format matches TMDB API response
      return {
        cast: [
          {
            id: 1,
            name: "Actor 1",
            character: "Character 1",
            profile_path: null,
            order: 0
          },
          {
            id: 2,
            name: "Actor 2",
            character: "Character 2",
            profile_path: null,
            order: 1
          },
          {
            id: 3,
            name: "Actor 3",
            character: "Character 3",
            profile_path: null,
            order: 2
          }
        ],
        crew: [
          {
            id: 4,
            name: "Crew Member 1",
            job: "Director",
            department: "Directing",
            profile_path: null
          },
          {
            id: 5,
            name: "Crew Member 2",
            job: "Producer",
            department: "Production",
            profile_path: null
          }
        ]
      };
    } catch (error) {
      console.error("[TMDBService] Error fetching movie credits:", error);
      return null;
    }
  }
  
  /**
   * Fetch movie watch providers
   */
  static async getMovieWatchProviders(movieId: number): Promise<MovieWatchProviders | null> {
    try {
      // In a real app, this would use the TMDB API key
      // For now, we'll return mock data for demonstration
      
      // Simulating API call
      console.log(`[TMDBService] Getting watch providers for movie ${movieId}`);
      
      // Mock data format matches TMDB API response
      return {
        id: movieId,
        results: {
          US: {
            link: "https://www.themoviedb.org/movie/" + movieId + "/watch",
            flatrate: [
              {
                provider_id: 8,
                provider_name: "Netflix",
                logo_path: "/t2yyOv40HZeVlLjYsCsPHnWLk4W.jpg"
              },
              {
                provider_id: 9,
                provider_name: "Amazon Prime",
                logo_path: "/68MNrwlkpF7WnmNPXLah69CR5cb.jpg"
              }
            ],
            rent: [
              {
                provider_id: 3,
                provider_name: "Google Play Movies",
                logo_path: "/tbEdFQDwx5LEVr8WpSeXQSIirVq.jpg"
              }
            ],
            buy: [
              {
                provider_id: 2,
                provider_name: "Apple TV",
                logo_path: "/peURlLlr8jggOwK53fJ5wdQl05y.jpg"
              }
            ]
          }
        }
      };
    } catch (error) {
      console.error("[TMDBService] Error fetching movie watch providers:", error);
      return null;
    }
  }
}