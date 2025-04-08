'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { gql } from '@apollo/client';
import { ListMovieDisplay } from './ListMovieDisplay';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Button } from '../ui/button';
import { RefreshCw, AlertTriangle, Users, Lock, Globe, UserPlus, Plus, Edit, Calendar, Trash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { formatDistanceToNow } from 'date-fns';
import { GET_LIST_BY_ID } from '@/types/graphql/lists';
import { useLists } from '@/lib/lists/ListsContext';
import { useAuth } from '@/lib/auth/AuthContext';
import { BulkMovieAdder } from './BulkMovieAdder';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const DEFAULT_LIST_THUMBNAIL = '/images/default-list-cover.jpg';

interface ListDetailProps {
  listId: string;
  allowEdit?: boolean;
  allowDelete?: boolean;
}

export function ListDetail({ listId, allowEdit = true, allowDelete = true }: ListDetailProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { deleteList } = useLists();
  const [isRetrying, setIsRetrying] = useState(false);
  const [showAddMovies, setShowAddMovies] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Query to get list by ID
  const { data, loading, error, refetch } = useQuery(GET_LIST_BY_ID, {
    variables: { id: listId },
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
    errorPolicy: 'all', // Get both data and errors if partial data is available
    context: {
      // Add a special flag for the Apollo client middleware to use
      forceRefreshToken: true,
    },
    onCompleted: (data) => {
      console.log('List data loaded:', data);
    },
    onError: (error) => {
      console.error('Error loading list:', error);
      
      // Use the imported isAuthenticated value, not the non-existent variable
      console.log('Auth state during error:', { 
        isAuthenticated: !!user, // Use user object to check auth status
        userId: user?.id,
        hasAuth: !!localStorage.getItem('auth_token')
      });
      
      // Check if this is an authentication error
      if (error.message.includes('Authentication required') && !isRetrying) {
        console.log('Detected authentication error, attempting auto-retry with fresh token...');
        setIsRetrying(true);
        
        // Wait a moment to allow any token refresh to complete
        setTimeout(() => {
          refetch({
            context: {
              forceRefreshToken: true // Force token refresh on retry
            }
          }).then(() => {
            setIsRetrying(false);
            toast({
              title: "Refreshed",
              description: "Successfully refreshed authentication"
            });
          }).catch(retryError => {
            console.error('Retry failed:', retryError);
            setIsRetrying(false);
            toast({
              variant: "destructive",
              title: "Authentication Error",
              description: "Please try refreshing the page"
            });
          });
        }, 1000); // Wait 1 second before retrying
        
        return; // Don't show the default error toast during auto-retry
      }
      
      toast({
        variant: "destructive",
        title: "Failed to load list",
        description: error.message
      });
    }
  });

  // Get the list directly from the query response with safety checks
  const list = data?.getList || null;
  
  // Safety check for list created at date
  const safeList = useMemo(() => {
    if (!list) return null;
    
    // If createdAt is present and valid, use it; otherwise use current date
    try {
      const createdAt = list.createdAt ? new Date(list.createdAt).toISOString() : new Date().toISOString();
      const updatedAt = list.updatedAt ? new Date(list.updatedAt).toISOString() : new Date().toISOString();
      
      return {
        ...list,
        createdAt,
        updatedAt
      };
    } catch (e) {
      console.error('Error parsing list dates:', e);
      return {
        ...list,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
  }, [list]);

  const handleRetry = () => {
    setIsRetrying(true);
    refetch()
      .then(() => {
        setIsRetrying(false);
        toast({
          title: "Success",
          description: "List refreshed successfully"
        });
      })
      .catch((error) => {
        setIsRetrying(false);
        toast({
          variant: "destructive",
          title: "Refresh failed",
          description: error.message
        });
      });
  };

  const handleAddMoviesSuccess = () => {
    toast({
      title: "Success",
      description: "Movies added to list"
    });
    setShowAddMovies(false);
    refetch();
  };

  if (loading && !data) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription className="flex justify-between items-center">
          <span>Failed to load list: {error.message}</span>
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

  if (!safeList) {
    return (
      <Alert className="mb-6">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>List Not Found</AlertTitle>
      <AlertDescription>
      The list with ID "{listId}" could not be found in your lists. You may not have access to this list.
      </AlertDescription>
      </Alert>
    );
  }

  const getPrivacyIcon = () => {
    if (!list || !list.privacy) return <Lock className="h-4 w-4" />;
    
    switch (list.privacy) {
      case 'PUBLIC':
        return <Globe className="h-4 w-4" />;
      case 'PRIVATE':
        return <Lock className="h-4 w-4" />;
      case 'FOLLOWING':
        return <Users className="h-4 w-4" />;
      default:
        return <Lock className="h-4 w-4" />;
    }
  };

  const getPrivacyLabel = () => {
    if (!list || !list.privacy) return 'Private';
    
    switch (list.privacy) {
      case 'PUBLIC':
        return 'Public';
      case 'PRIVATE':
        return 'Private';
      case 'FOLLOWING':
        return 'Followers Only';
      default:
        return 'Private';
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero section with list details */}
      <div className="relative rounded-lg overflow-hidden bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/5 dark:to-background">
        <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6">
          {/* List thumbnail */}
          <div className="flex-shrink-0 w-full md:w-48 h-48 rounded-md overflow-hidden bg-muted">
            {list.thumbnail ? (
              <img 
                src={list.thumbnail} 
                alt={list.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/10">
                <span className="text-2xl font-bold text-primary/50">{list.name.charAt(0)}</span>
              </div>
            )}
          </div>
          
          {/* List details */}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="outline" className="flex items-center gap-1">
                {getPrivacyIcon()}
                <span>{getPrivacyLabel()}</span>
              </Badge>
              
              <Badge variant="outline" className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Created {formatDistanceToNow(new Date(list.createdAt), { addSuffix: true })}</span>
              </Badge>
              
              {list.type === 'CUSTOM' && (
                <Badge variant="outline">Custom List</Badge>
              )}
              
              {list.type === 'STANDARD' && (
                <Badge variant="outline">Standard List</Badge>
              )}
              
              {list.isFeatured && (
                <Badge variant="default">Featured</Badge>
              )}
            </div>
            
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{list.name}</h1>
            
            {list.description && (
              <p className="text-muted-foreground mb-4">{list.description}</p>
            )}
            
            <div className="flex items-center gap-2 mb-4">
              <Avatar className="h-8 w-8">
                <AvatarImage src={list.owner?.avatarUrl || ''} alt={list.owner?.username || 'User'} />
                <AvatarFallback>{list.owner?.username?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{list.owner?.username}</p>
                <p className="text-xs text-muted-foreground">List Creator</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1"
                onClick={() => setShowAddMovies(!showAddMovies)}
              >
                {showAddMovies ? (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Add Movies
                  </>
                )}
              </Button>
              
              {allowEdit && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1"
                  asChild
                >
                  <a href={`/lists/${list.id}/edit`}>
                    <Edit className="h-4 w-4" />
                    Edit List
                  </a>
                </Button>
              )}
              
              {allowDelete && list.owner?.id === user?.id && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1 text-destructive hover:bg-destructive/10"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash className="h-4 w-4" />
                  Delete List
                </Button>
              )}
              
              {list.collaborators?.length > 0 && (
                <Button variant="outline" size="sm" className="gap-1">
                  <UserPlus className="h-4 w-4" />
                  {list.collaborators.length} Collaborator{list.collaborators.length !== 1 ? 's' : ''}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Add movies panel */}
      {showAddMovies && (
        <Card>
          <CardHeader>
            <CardTitle>Add Movies to List</CardTitle>
            <CardDescription>
              Search for movies to add to "{list.name}"
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BulkMovieAdder 
              listId={list.id} 
              onSuccess={handleAddMoviesSuccess}
            />
          </CardContent>
        </Card>
      )}
      
      {/* List content tabs */}
      <Tabs defaultValue="movies" className="w-full">
        <TabsList>
          <TabsTrigger value="movies">Movies ({list.itemCount || 0})</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        
        <TabsContent value="movies">
          <ListMovieDisplay listId={list.id} />
        </TabsContent>
        
        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>List Statistics</CardTitle>
              <CardDescription>Analytics and insights about this list</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Stats coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>List Activity</CardTitle>
              <CardDescription>Recent changes and interactions</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Activity feed coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete "{list.name}"</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this list? This action cannot be undone.
              All movies in this list will be removed from the collection.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                try {
                  await deleteList(list.id);
                  toast({
                    title: "List Deleted",
                    description: `Successfully deleted "${list.name}"`
                  });
                  setShowDeleteDialog(false);
                  // Redirect to lists page after successful deletion
                  router.push('/lists');
                } catch (error) {
                  console.error('Error deleting list:', error);
                  toast({
                    title: "Failed to Delete",
                    description: error instanceof Error ? error.message : "Unknown error occurred",
                    variant: "destructive"
                  });
                }
              }}
            >
              Delete List
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
