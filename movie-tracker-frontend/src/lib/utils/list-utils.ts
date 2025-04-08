import { ApolloClient } from '@apollo/client';
import { GET_MY_LISTS } from '@/types/graphql/lists';

/**
 * Utility function to check for and clean up duplicate watchlists
 * This should be called periodically, such as at application start
 * or whenever lists are fetched
 */
export const cleanupDuplicateWatchlists = async (client: ApolloClient<any>) => {
  try {
    console.log('Checking for duplicate watchlists...');
    const { data } = await client.query({
      query: GET_MY_LISTS,
      fetchPolicy: 'network-only' // Force fresh data
    });
    
    if (!data || !data.myLists) {
      console.log('No lists data available for cleanup check');
      return;
    }
    
    // Find all lists named 'Watchlist'
    const watchlists = data.myLists.filter(list => 
      list.name.toLowerCase() === 'watchlist'
    );
    
    console.log(`Found ${watchlists.length} watchlists in total`);
    
    if (watchlists.length > 1) {
      console.warn(`Found ${watchlists.length} watchlists, keeping the first one`);
      
      // Keep the first one as the canonical watchlist
      const primaryWatchlist = watchlists[0];
      
      // Store the canonical ID for future use
      localStorage.setItem('watchlist_list_id', primaryWatchlist.id);
      
      console.log(`Set ${primaryWatchlist.id} as the canonical watchlist ID`);
      
      // We don't automatically delete the duplicates here
      // as that would require modifying data, which should be done
      // explicitly by the user or through a dedicated cleanup function
      // This just ensures we consistently use the same watchlist
    }
  } catch (error) {
    console.error('Error during duplicate watchlist cleanup:', error);
  }
};