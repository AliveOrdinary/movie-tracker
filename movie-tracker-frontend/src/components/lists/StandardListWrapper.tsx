'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useApolloClient } from '@apollo/client';
import { gql } from '@apollo/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ListDetail } from './ListDetail';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { 
  GET_MY_LISTS, 
  CREATE_LIST, 
  ListType, 
  ListPrivacy 
} from '@/types/graphql/lists';

interface StandardListWrapperProps {
  listName: string;
  listType: ListType;
  allowEdit?: boolean;
  allowDelete?: boolean;
}

export function StandardListWrapper({ 
  listName, 
  listType,
  allowEdit = true,
  allowDelete = true
}: StandardListWrapperProps) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const client = useApolloClient();
  const [listId, setListId] = useState<string | null>(null);
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  // Global lock to prevent concurrent list creation attempts
  const [isCreatingListGlobally, setIsCreatingListGlobally] = useState(false);

  // Effect to monitor any changes to listId
  useEffect(() => {
    if (listId) {
      console.log(`StandardListWrapper: Using list ID: ${listId} for ${listName}`);
      // Cache this in localStorage for consistency
      localStorage.setItem(`${listName.toLowerCase()}_list_id`, listId);
      
      // If this is a watchlist, also update the special watchlist cache key
      if (listName.toLowerCase() === 'watchlist') {
        console.log(`Updating special watchlist cache with ID: ${listId}`);
        localStorage.setItem('watchlist_list_id', listId);
      }
    }
  }, [listId, listName]);

  // Query to get current user's lists
  const { data, loading, error, refetch } = useQuery(GET_MY_LISTS, {
    variables: { type: listType },
    skip: !isAuthenticated,
    fetchPolicy: 'network-only', // Always get fresh data
    context: {
      forceRefreshToken: true, // Always force token refresh for this critical query
    },
    onCompleted: (data) => {
      console.log(`MY_LISTS query completed for ${listName}:`, data);
    },
    onError: (error) => {
      console.error(`Error fetching lists (type: ${listType}):`, error);
      console.log('Auth state during error:', { 
        isAuthenticated,
        hasToken: !!localStorage.getItem('auth_token')
      });
      
      // If we got an auth error, attempt to auto-retry
      if (error.message.includes('Authentication required') ||
          error.message.includes('Unauthorized')) {
        console.log('Authentication error detected. Auto-retrying with fresh token...');
        
        // Wait briefly to allow any other token refresh operations to complete
        setTimeout(() => {
          refetch({
            context: {
              forceRefreshToken: true // Extra emphasis on forcing refresh
            }
          }).catch(retryError => {
            console.error('Auto-retry failed:', retryError);
            toast({
              title: "Authentication Issue",
              description: "Please refresh the page to update your session",
              variant: "destructive"
            });
          });
        }, 1000);
      }
    }
  });

  // Create list mutation
  const [createList] = useMutation(CREATE_LIST);

  // Find the standard list with the matching name
  useEffect(() => {
    if (data?.myLists) {
      console.log(`Received ${data.myLists.length} lists from backend:`, data.myLists.map(l => ({ id: l.id, name: l.name, type: l.type })));
      
      // First try to get the cached list ID
      const cachedListId = localStorage.getItem(`${listName.toLowerCase()}_list_id`);
      if (cachedListId) {
        // Check if this ID exists in our lists
        const cachedList = data.myLists.find(list => list.id === cachedListId);
        if (cachedList) {
          console.log(`Using cached list ID: ${cachedListId}`);
          setListId(cachedListId);
          return;
        } else {
          // Remove invalid cached ID
          localStorage.removeItem(`${listName.toLowerCase()}_list_id`);
        }
      }
      
      // This is a possible issue - we might have multiple watchlists
      // Let's check if we have more than one list with this name
      const matchingLists = data.myLists.filter(list => {
        return list.name.toLowerCase() === listName.toLowerCase();
      });
      
      if (matchingLists.length > 1) {
        console.warn(`Found ${matchingLists.length} lists named '${listName}'! This could cause issues.`);
        
        // Clean up duplicate watchlists by keeping the first one
        if (listName.toLowerCase() === 'watchlist') {
          console.log('Cleaning up duplicate watchlists...');
          
          // Keep the first one as the primary watchlist
          const primaryWatchlist = matchingLists[0];
          console.log(`Setting ${primaryWatchlist.id} as primary watchlist`);
          
          // Cache this ID for all future operations
          localStorage.setItem('watchlist_list_id', primaryWatchlist.id);
          localStorage.setItem(`${listName.toLowerCase()}_list_id`, primaryWatchlist.id);
          
          // TODO: Consider implementing a background cleanup of duplicate lists
          // or at least alerting the user that duplicates exist
        } else {
          // For non-watchlist duplicates, just take the first one
          console.log(`Using first matching list with ID: ${matchingLists[0].id}`);
          localStorage.setItem(`${listName.toLowerCase()}_list_id`, matchingLists[0].id);
        }
        
        setListId(matchingLists[0].id);
        return;
      }
      
      // If we only have one matching list, use it
      if (matchingLists.length === 1) {
        console.log(`Using existing ${listName} list with ID: ${matchingLists[0].id}`);
        setListId(matchingLists[0].id);
        // Cache this for future use
        localStorage.setItem(`${listName.toLowerCase()}_list_id`, matchingLists[0].id);
      } else {
        console.log(`No ${listName} list found among ${data.myLists.length} lists`);
      }
    } else {
      console.log('No myLists data received from backend');
    }
  }, [data, listName, listType]);

  // Handle creation of the standard list if it doesn't exist
  const handleCreateStandardList = async () => {
    if (!isAuthenticated) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please sign in to access this feature"
      });
      return;
    }

    // Check global lock to prevent multiple creation attempts
    if (isCreatingListGlobally) {
      console.log('List creation already in progress, skipping duplicate request');
      toast({
        title: "Please Wait",
        description: "List creation is already in progress"
      });
      return;
    }

    // Enable global lock
    setIsCreatingListGlobally(true);
    setIsCreatingList(true);

    try {
      // First do a super-fresh refetch to absolutely make sure we don't have the list
      try {
        console.log('Doing final check before list creation...');
        const refreshResult = await refetch();
        
        // Check for any lists with this name (case insensitive)
        const anyMatchingList = refreshResult.data?.myLists?.find(list => 
          list.name.toLowerCase() === listName.toLowerCase()
        );
        
        if (anyMatchingList) {
          console.log(`Found existing list during final check: ${anyMatchingList.id}`);
          setListId(anyMatchingList.id);
          // Cache the list ID for future use
          localStorage.setItem(`${listName.toLowerCase()}_list_id`, anyMatchingList.id);
          toast({
            title: "List Found",
            description: `Existing ${listName} list found and connected`
          });
          return;
        }
      } catch (refreshError) {
        console.warn('Failed to do final refresh before list creation:', refreshError);
      }

      console.log(`Creating new ${listName} list...`);
      const { data } = await createList({
        variables: {
          input: {
            name: listName,
            type: "STANDARD", // Force string type to avoid enum case issues
            privacy: ListPrivacy.PRIVATE,
            description: `Your ${listName.toLowerCase()} list`
          }
        }
      });
      
      if (data?.createList) {
        console.log(`List created successfully with ID: ${data.createList.id}`);
        setListId(data.createList.id);
        
        // Cache the list ID for future use
        localStorage.setItem(`${listName.toLowerCase()}_list_id`, data.createList.id);
        
        // If this is a watchlist, also store in the special cache key for consistency
        if (listName.toLowerCase() === 'watchlist') {
          console.log(`Storing watchlist ID in special cache: ${data.createList.id}`);
          localStorage.setItem('watchlist_list_id', data.createList.id);
        }
        
        toast({
          title: "Success",
          description: `${listName} list created successfully`
        });
      }
    } catch (error) {
      console.error('Error creating list:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create list"
      });
    } finally {
      setIsCreatingList(false);
      setIsCreatingListGlobally(false); // Release global lock
    }
  };

  // Handle retry when there's an error
  const handleRetry = () => {
    setIsRetrying(true);
    refetch()
      .then(() => {
        setIsRetrying(false);
      })
      .catch(() => {
        setIsRetrying(false);
      });
  };

  if (!isAuthenticated) {
    return (
      <Alert>
        <AlertTitle>Authentication Required</AlertTitle>
        <AlertDescription>
          Please sign in to view your {listName.toLowerCase()}.
        </AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription className="flex justify-between items-center">
          <span>Failed to load {listName.toLowerCase()}: {error.message}</span>
          <Button 
            onClick={handleRetry} 
            size="sm" 
            variant="outline" 
            disabled={isRetrying}
          >
            {isRetrying ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </>
            )}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // If the list doesn't exist, show create option
  if (!listId) {
    return (
      <Alert className="mb-6">
        <AlertTitle>No {listName} Found</AlertTitle>
        <AlertDescription className="flex flex-col gap-4">
          <p>You don't have a {listName.toLowerCase()} yet.</p>
          <div className="flex gap-2">
            <Button 
              onClick={handleCreateStandardList} 
              disabled={isCreatingList}
              className="w-fit"
            >
              {isCreatingList ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>Create {listName}</>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                refetch();
                toast({
                  title: "Refreshing",
                  description: "Refreshing list data..."
                });
              }}
              className="w-fit"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Lists
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Once we have a list ID, render the detail component
  return <ListDetail listId={listId} allowEdit={allowEdit} allowDelete={allowDelete} />;
}