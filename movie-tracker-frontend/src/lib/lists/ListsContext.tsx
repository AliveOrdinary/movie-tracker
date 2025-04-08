// src/lib/lists/ListsContext.tsx
'use client';

import { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  CREATE_LIST,
  UPDATE_LIST,
  DELETE_LIST,
  ADD_LIST_ITEM,
  REMOVE_LIST_ITEM,
  FAVORITE_LIST,
  BULK_ADD_MOVIES,
  BULK_REMOVE_MOVIES,
  GET_MY_LISTS,
  GET_COLLABORATIVE_LISTS,
  GET_FAVORITED_LISTS,
  GET_TRENDING_LISTS,
  List,
  ListResponse,
  CreateListInput,
  ListItem,
  ListType,
  ListPrivacy
} from '@/types/graphql/lists';
import { normalizeTmdbId } from '@/lib/utils/movie-utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth/AuthContext';
import { usePathname } from 'next/navigation';

// Removed ensureDefaultEnums function as backend and frontend now consistently use UPPERCASE enum values

interface ListsContextType {
  // Core operations
  createList: (input: CreateListInput) => Promise<List>;
  updateList: (input: any) => Promise<List>;
  deleteList: (id: string) => Promise<boolean>;
  addListItem: (input: any) => Promise<any>;
  removeListItem: (listId: string, itemId: string) => Promise<boolean>;
  favoriteList: (listId: string) => Promise<boolean>;
  bulkAddMovies: (listId: string, movieIds: number[]) => Promise<ListItem[]>;
  bulkRemoveMovies: (listId: string, movieIds: number[]) => Promise<boolean>;
  
  // Queries
  myLists: List[];
  collaborativeLists: List[];
  favoritedLists: ListResponse | null;
  trendingLists: ListResponse | null;
  
  // Loading states
  loading: {
    myLists: boolean;
    collaborativeLists: boolean;
    favoritedLists: boolean;
    trendingLists: boolean;
  };
  
  // Refetch functions
  refetchMyLists: () => Promise<void>;
  refetchCollaborativeLists: () => Promise<void>;
  refetchFavoritedLists: () => Promise<void>;
  refetchTrendingLists: () => Promise<void>;
}

const ListsContext = createContext<ListsContextType | undefined>(undefined);

export function ListsProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith('/auth');
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  
  // Control when to make authenticated queries
  const shouldFetchAuthData = isAuthenticated && !isAuthPage;
  
  // For trending lists, we can show these to everyone
  const {
    data: trendingListsData,
    loading: trendingListsLoading,
    refetch: refetchTrendingLists
  } = useQuery(GET_TRENDING_LISTS, {
    variables: { timeframe: 'week', page: 1, limit: 10 },
    skip: isAuthPage, // Skip even these on auth pages
  });

  // For authenticated queries, only run them when the user is logged in
  const {
    data: myListsData,
    loading: myListsLoading,
    refetch: refetchMyLists
  } = useQuery(GET_MY_LISTS, {
    skip: !shouldFetchAuthData
  });

  const {
    data: collaborativeListsData,
    loading: collaborativeListsLoading,
    refetch: refetchCollaborativeLists
  } = useQuery(GET_COLLABORATIVE_LISTS, {
    skip: !shouldFetchAuthData
  });

  const {
    data: favoritedListsData,
    loading: favoritedListsLoading,
    refetch: refetchFavoritedLists
  } = useQuery(GET_FAVORITED_LISTS, {
    variables: { page: 1, limit: 10 },
    skip: !shouldFetchAuthData
  });

  // Mutations
  const [createListMutation] = useMutation(CREATE_LIST);
  const [updateListMutation] = useMutation(UPDATE_LIST);
  const [deleteListMutation] = useMutation(DELETE_LIST);
  const [addListItemMutation] = useMutation(ADD_LIST_ITEM);
  const [removeListItemMutation] = useMutation(REMOVE_LIST_ITEM);
  const [favoriteListMutation] = useMutation(FAVORITE_LIST);
  const [bulkAddMoviesMutation] = useMutation(BULK_ADD_MOVIES);
  const [bulkRemoveMoviesMutation] = useMutation(BULK_REMOVE_MOVIES);

  // Core operations
  const createList = useCallback(async (input: CreateListInput) => {
    if (!isAuthenticated) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "You must be logged in to create a list"
      });
      throw new Error("Authentication required");
    }
    
    // Check for duplicate create list operations (prevent race conditions)
    const currentOperation = localStorage.getItem('creating_list_operation');
    const operationTimestamp = currentOperation ? parseInt(currentOperation, 10) : 0;
    
    // If there's a recent operation in the past 10 seconds, prevent duplicates
    if (currentOperation && Date.now() - operationTimestamp < 10000) { // 10 second lockout
      console.log(`List creation operation already in progress since ${new Date(operationTimestamp).toISOString()}, preventing duplicate`);
      throw new Error("Another list creation is already in progress. Please try again in a few seconds.");
    }
    
    // Set operation timestamp to track this operation
    localStorage.setItem('creating_list_operation', Date.now().toString());
    
    // For watchlists, perform extra validation
    if (input.name === 'Watchlist' || input.name?.toLowerCase() === 'watchlist') {
      // Check for any existing watchlist to prevent duplicates
      console.log('Performing additional validation for watchlist creation...');
      
      // Check if we already have a watchlist in localStorage
      const existingWatchlistId = localStorage.getItem('watchlist_list_id');
      if (existingWatchlistId) {
        console.log(`Found cached watchlist ID: ${existingWatchlistId}, preventing duplicate creation`);
        localStorage.removeItem('creating_list_operation'); // Clear operation lock
        
        // Check if this ID exists in our current lists
        const existingList = myLists.find(list => list.id === existingWatchlistId);
        if (existingList) {
          console.log('Validated existing watchlist, returning it instead of creating a new one');
          return existingList;
        }
      }
      
      // Next, check all lists for any watchlist
      const existingWatchlist = myLists.find(list => 
        list.name?.toLowerCase() === 'watchlist' ||
        (list.type === ListType.STANDARD && list.name.includes('watch'))
      );
      
      if (existingWatchlist) {
        console.log(`Found existing watchlist with ID: ${existingWatchlist.id}, preventing duplicate creation`);
        localStorage.setItem('watchlist_list_id', existingWatchlist.id); // Update cache
        localStorage.removeItem('creating_list_operation'); // Clear operation lock
        return existingWatchlist;
      }
    }
    
    try {
      console.log('Creating list with input:', input);
      
      // Set default values for enums if not provided
      const preparedInput = {
        ...input,
        type: input.type || ListType.CUSTOM,
        privacy: input.privacy || ListPrivacy.PRIVATE
      };
      
      // Force STANDARD lists to be PUBLIC for better compatibility
      if (preparedInput.type === ListType.STANDARD) {
        console.log('Forcing STANDARD list to be PUBLIC');
        preparedInput.privacy = ListPrivacy.PUBLIC;
      }
      
      console.log('Prepared input for backend:', preparedInput);
      
      // Use Apollo mutation properly
      const { data } = await createListMutation({
        variables: { input: preparedInput },
        fetchPolicy: 'no-cache' // Ensure we don't use cached data
      });
      
      console.log('List creation response:', data);
      
      if (!data?.createList) {
        console.error('List creation failed: No data returned');
        throw new Error('List creation failed: No data returned');
      }
      
      toast({
        title: "Success",
        description: "List created successfully",
      });
      
      // For watchlists, store the ID to prevent future duplicates
      if (data.createList.name.toLowerCase() === 'watchlist') {
        console.log(`Caching new watchlist ID: ${data.createList.id}`);
        localStorage.setItem('watchlist_list_id', data.createList.id);
      }
      
      // Refetch lists to update state
      refetchMyLists();
      
      return data.createList;
    } catch (error) {
      console.error('List creation error:', error);
      
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create list"
      });
      
      throw error;
    } finally {
      // Always clear the operation lock when we're done
      localStorage.removeItem('creating_list_operation');
    }
  }, [toast, isAuthenticated, createListMutation, refetchMyLists]);

  const updateList = useCallback(async (input: any) => {
    if (!isAuthenticated) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "You must be logged in to update a list"
      });
      throw new Error("Authentication required");
    }
    
    try {
      // Set default values for enums if not provided
      const preparedInput = {
        ...input,
        type: input.type || ListType.CUSTOM,
        privacy: input.privacy || ListPrivacy.PRIVATE
      };
      
      const { data } = await updateListMutation({ variables: { input: preparedInput } });
      toast({
        title: "Success",
        description: "List updated successfully",
      });
      return data.updateList;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update list"
      });
      throw error;
    }
  }, [updateListMutation, toast, isAuthenticated]);

  // Extract myLists from query result for use in useCallback dependencies
  const myLists = myListsData?.myLists || [];

  const deleteList = useCallback(async (id: string) => {
    if (!isAuthenticated) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "You must be logged in to delete a list"
      });
      throw new Error("Authentication required");
    }
    
    // Prevent duplicate deletion requests
    if (deleteInProgress) {
      console.log('Delete already in progress, skipping');
      return true;
    }
    
    setDeleteInProgress(true);
    
    try {
      // Get list info before deleting to handle special cases
      const listToDelete = myLists.find(list => list.id === id);
      const isStandardList = listToDelete?.type === ListType.STANDARD;
      const listName = listToDelete?.name || 'list';
      
      console.log(`Deleting list with ID: ${id}, Type: ${listToDelete?.type}, Name: ${listName}`);
      
      // For standard lists like Watchlist, we need to ensure proper cleanup
      if (isStandardList) {
        console.log(`Special handling for standard list: ${listName}`);
      }
      
      const response = await deleteListMutation({ 
        variables: { id },
        refetchQueries: ['GetMyLists']
      });
      
      console.log('Delete response:', response);

      // Force refetch to ensure backend is in sync
      await refetchMyLists();
      await refetchCollaborativeLists();
      await refetchFavoritedLists();
      
      // If we're deleting a watchlist, also clear the cached ID
      if (listToDelete?.name?.toLowerCase() === 'watchlist') {
        const cachedWatchlistId = localStorage.getItem('watchlist_list_id');
        if (cachedWatchlistId === id) {
          console.log('Clearing cached watchlist ID after deletion');
          localStorage.removeItem('watchlist_list_id');
        }
      }
      
      toast({
        title: "Success",
        description: `${listName} deleted successfully`,
      });
      
      setDeleteInProgress(false);
      return true;
    } catch (error) {
      console.error('Error deleting list:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete list"
      });
      setDeleteInProgress(false);
      throw error;
    }
  }, [deleteListMutation, toast, isAuthenticated, refetchMyLists, refetchCollaborativeLists, refetchFavoritedLists, myLists, deleteInProgress]);

  const addListItem = useCallback(async (input: any) => {
    if (!isAuthenticated) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "You must be logged in to add items to a list"
      });
      throw new Error("Authentication required");
    }
    
    try {
      // Ensure we're using the correct numeric TMDB ID for input
      const normalizedInput = {
        ...input,
        tmdbId: normalizeTmdbId(input.tmdbId)
      };
      
      console.log(`Adding movie with TMDB ID ${normalizedInput.tmdbId} to list ${normalizedInput.listId}`);
      
      const { data } = await addListItemMutation({ 
        variables: { input: normalizedInput },
        refetchQueries: ['GetListItems']
      });
      
      toast({
        title: "Success",
        description: "Item added to list",
      });
      
      return data.addListItem;
    } catch (error) {
      console.error('Error adding list item:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add item to list"
      });
      throw error;
    }
  }, [addListItemMutation, toast, isAuthenticated]);

  const removeListItem = useCallback(async (listId: string, itemId: string) => {
    if (!isAuthenticated) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "You must be logged in to remove items from a list"
      });
      throw new Error("Authentication required");
    }
    
    try {
      const { data } = await removeListItemMutation({ 
        variables: { listId, itemId } 
      });
      toast({
        title: "Success",
        description: "Item removed from list",
      });
      return data.removeListItem;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove item from list"
      });
      throw error;
    }
  }, [removeListItemMutation, toast, isAuthenticated]);

  const favoriteList = useCallback(async (listId: string) => {
    if (!isAuthenticated) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "You must be logged in to favorite a list"
      });
      throw new Error("Authentication required");
    }
    
    try {
      const { data } = await favoriteListMutation({ variables: { listId } });
      toast({
        title: "Success",
        description: data.favoriteList 
          ? "Added to favorites" 
          : "Removed from favorites",
      });
      return data.favoriteList;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to favorite list"
      });
      throw error;
    }
  }, [favoriteListMutation, toast, isAuthenticated]);

  const bulkAddMovies = useCallback(async (listId: string, movieIds: number[]) => {
    if (!isAuthenticated) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "You must be logged in to add movies to a list"
      });
      throw new Error("Authentication required");
    }
    
    try {
      // Log the movie IDs we're adding for debugging
      console.log(`Adding ${movieIds.length} movies to list ${listId} with IDs:`, movieIds);
      console.log('Raw movie IDs data types:', movieIds.map(id => `${typeof id}:${id}`));
      
      // Normalize each movie ID to ensure they're all valid TMDB IDs (numbers)
      const normalizedMovieIds = movieIds
        .map(id => normalizeTmdbId(id))
        .filter(id => id > 0); // Filter out invalid IDs
      
      // Make sure we still have valid movie IDs after normalization
      if (normalizedMovieIds.length === 0) {
        throw new Error("No valid movie IDs to add");
      }
      
      console.log(`Normalized ${movieIds.length} movie IDs to ${normalizedMovieIds.length} valid TMDB IDs:`, normalizedMovieIds);
      
      // Create the mutation variables
      const mutationVars = {
        input: {
          listId,
          tmdbIds: normalizedMovieIds // These are TMDB IDs (numbers)
        }
      };
      
      console.log('EXACT MUTATION VARIABLES:', JSON.stringify(mutationVars));
      
      const { data } = await bulkAddMoviesMutation({ 
        variables: mutationVars,
        refetchQueries: ['GetListItems']
      });
      
      // Refresh lists after adding movies to ensure counts are updated
      await refetchMyLists().catch(err => {
        console.warn('Error refreshing lists after adding movies:', err);
      });
      
      toast({
        title: "Success",
        description: `Added ${normalizedMovieIds.length} ${normalizedMovieIds.length === 1 ? 'movie' : 'movies'} to list`,
      });
      
      // Return empty array if data is null to avoid errors
      return data?.bulkAddMovies || [];
    } catch (error) {
      console.error('Error in bulkAddMovies:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add movies to list"
      });
      throw error;
    }
  }, [bulkAddMoviesMutation, toast, isAuthenticated, refetchMyLists]);

  const bulkRemoveMovies = useCallback(async (listId: string, movieIds: number[]) => {
    if (!isAuthenticated) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "You must be logged in to remove movies from a list"
      });
      throw new Error("Authentication required");
    }
    
    try {
      // Normalize each movie ID to ensure they're all valid TMDB IDs (numbers)
      const normalizedMovieIds = movieIds
        .map(id => normalizeTmdbId(id))
        .filter(id => id > 0); // Filter out invalid IDs
      
      // Make sure we still have valid movie IDs after normalization
      if (normalizedMovieIds.length === 0) {
        throw new Error("No valid movie IDs to remove");
      }
      
      console.log(`Removing ${normalizedMovieIds.length} movies from list ${listId}:`, normalizedMovieIds);
      
      const { data } = await bulkRemoveMoviesMutation({ 
        variables: { 
          input: {
            listId,
            tmdbIds: normalizedMovieIds // These are TMDB IDs (numbers)
          } 
        },
        refetchQueries: ['GetListItems']
      });
      
      toast({
        title: "Success",
        description: `Removed ${normalizedMovieIds.length} movies from list`,
      });
      
      return data.bulkRemoveMovies;
    } catch (error) {
      console.error('Error in bulkRemoveMovies:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove movies from list"
      });
      throw error;
    }
  }, [bulkRemoveMoviesMutation, toast, isAuthenticated]);

  // Update myLists when data changes
  useEffect(() => {
    console.log('myListsData changed, updated myLists value');
  }, [myListsData]);

  // Refetch data when auth state changes
  useEffect(() => {
    if (shouldFetchAuthData) {
      // First refetch all lists
      refetchMyLists()
        .then(result => {
          // Check for duplicate watchlists if we have lists data
          if (result?.data?.myLists) {
            // Look for multiple watchlists
            const watchlists = result.data.myLists.filter(list => 
              list.name.toLowerCase() === 'watchlist'
            );
            
            // If we found multiple watchlists, use the first one consistently
            if (watchlists.length > 1) {
              console.warn(`Found ${watchlists.length} watchlists during initialization, using first one consistently`);
              localStorage.setItem('watchlist_list_id', watchlists[0].id);
            }
          }
        })
        .catch(err => console.error("Failed to refetch my lists:", err));
        
      refetchCollaborativeLists().catch(err => console.error("Failed to refetch collaborative lists:", err));
      refetchFavoritedLists().catch(err => console.error("Failed to refetch favorited lists:", err));
    }
  }, [shouldFetchAuthData, refetchMyLists, refetchCollaborativeLists, refetchFavoritedLists]);

  const value = {
    // Core operations
    createList,
    updateList,
    deleteList,
    addListItem,
    removeListItem,
    favoriteList,
    bulkAddMovies,
    bulkRemoveMovies,

    // Queries data
    myLists,
    collaborativeLists: collaborativeListsData?.collaborativeLists || [],
    favoritedLists: favoritedListsData?.favoritedLists || null,
    trendingLists: trendingListsData?.trendingLists || null,

    // Loading states
    loading: {
      myLists: myListsLoading,
      collaborativeLists: collaborativeListsLoading,
      favoritedLists: favoritedListsLoading,
      trendingLists: trendingListsLoading,
    },

    // Refetch functions
    refetchMyLists: async () => { 
      if (shouldFetchAuthData) {
        console.log('Explicitly refetching myLists');
        const result = await refetchMyLists();
        console.log('Refetch myLists result:', result.data?.myLists?.length || 0, 'lists');
        return result;
      }
    },
    refetchCollaborativeLists: async () => {
      if (shouldFetchAuthData) {
        console.log('Explicitly refetching collaborativeLists');
        return await refetchCollaborativeLists();
      }
    },
    refetchFavoritedLists: async () => {
      if (shouldFetchAuthData) {
        console.log('Explicitly refetching favoritedLists');
        return await refetchFavoritedLists();
      }
    },
    refetchTrendingLists,
  };

  return (
    <ListsContext.Provider value={value}>
      {children}
    </ListsContext.Provider>
  );
}

export function useLists() {
  const context = useContext(ListsContext);
  if (context === undefined) {
    throw new Error('useLists must be used within a ListsProvider');
  }
  return context;
}