'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ListType, ListPrivacy } from '@/types/graphql/lists';
import { useLists } from '@/lib/lists/ListsContext';
import { useAuth } from '@/lib/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { ListCard } from '@/components/lists/ListCard';
import { ListRow } from '@/components/lists/ListRow';
import { ListCollectionGrid } from '@/components/lists/ListCollectionGrid';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, LayoutGrid, List, SlidersHorizontal } from 'lucide-react';

// Types
type ViewMode = 'grid' | 'list';
type SortOption = 'recent' | 'name' | 'items' | 'favorites';

export default function ListsPage() {
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [activeTab, setActiveTab] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // For forcing re-renders
  const [createListData, setCreateListData] = useState({
    name: '',
    description: '',
    privacy: ListPrivacy.PRIVATE,
    type: ListType.CUSTOM
  });
  const { user } = useAuth();

  // Lists Context
  const { 
    myLists, 
    collaborativeLists,
    favoritedLists,
    trendingLists,
    loading,
    createList,
    refetchMyLists,
    refetchCollaborativeLists,
    refetchFavoritedLists,
    refetchTrendingLists
  } = useLists();

  // Effect to refetch lists only once on mount or when refreshKey changes
  useEffect(() => {
    let isMounted = true;
    
    const fetchAllLists = async () => {
      if (!isMounted) return;
      
      try {
        console.log('Fetching lists with refreshKey:', refreshKey);
        // Force refetch all types of lists to ensure UI is updated
        await refetchMyLists();
        await refetchCollaborativeLists();
        await refetchFavoritedLists();
        await refetchTrendingLists();
        console.log('Lists refetched successfully');
      } catch (error) {
        console.error('Error refetching lists:', error);
      }
    };

    fetchAllLists();
    
    return () => {
      isMounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]); // Only depend on refreshKey, not on the refetch functions

  // Handle create list
  const handleCreateList = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      console.log('Creating list with data:', createListData);
      
      const createdList = await createList({
        name: createListData.name,
        description: createListData.description || undefined,
        type: createListData.type,
        privacy: createListData.privacy,
      });
      
      console.log('List created successfully:', createdList);
      
      setShowCreateDialog(false);
      setCreateListData({
        name: '',
        description: '',
        privacy: ListPrivacy.PRIVATE,
        type: ListType.CUSTOM
      });

      // Refresh the lists after creating a new one
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Detailed error creating list:', error);
      console.error('Full error object:', JSON.stringify(error, null, 2));
    }
  };

  // Sort lists based on selected option
  const sortLists = (lists: any[]) => {
    return [...lists].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'items':
          return b.itemCount - a.itemCount;
        case 'favorites':
          return b.favoriteCount - a.favoriteCount;
        case 'recent':
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });
  };

  // Filter out STANDARD lists for display purposes with better type handling
  const filteredMyLists = myLists.filter(list => {
    // Handle undefined or null lists
    if (!list) return false;
    
    // Check various forms of the type property
    const typeStr = typeof list.type === 'string' ? list.type.toUpperCase() : '';
    return typeStr !== 'STANDARD';
  });
  
  const sortedMyLists = sortLists(filteredMyLists);
  const sortedCollaborativeLists = sortLists(collaborativeLists);

  if (loading.myLists || loading.collaborativeLists) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Your Lists</h1>
        <div className="flex items-center gap-4">
          {/* View Mode Toggle */}
          <div className="border rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setSortBy('recent')}
                className={sortBy === 'recent' ? 'bg-accent' : ''}
              >
                Recently Updated
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setSortBy('name')}
                className={sortBy === 'name' ? 'bg-accent' : ''}
              >
                Name
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setSortBy('items')}
                className={sortBy === 'items' ? 'bg-accent' : ''}
              >
                Number of Items
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setSortBy('favorites')}
                className={sortBy === 'favorites' ? 'bg-accent' : ''}
              >
                Most Favorites
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Create List Button */}
          <Button asChild>
            <Link href="/lists/new">
              <Plus className="h-4 w-4 mr-2" />
              Create List
            </Link>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Lists</TabsTrigger>
          <TabsTrigger value="collaborative">Shared with You</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {sortedMyLists.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium">No Lists Yet</h3>
              <p className="text-muted-foreground mt-2">
                Create your first list to start organizing your movies
              </p>
              <Button asChild className="mt-4">
                <Link href="/lists/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create List
                </Link>
              </Button>
            </div>
          ) : (
            viewMode === 'grid' ? (
              <ListCollectionGrid 
                lists={sortedMyLists}
                key={`grid-lists-${refreshKey}`} // Add key to force re-render
              />
            ) : (
              <div className="space-y-4" key={`list-rows-${refreshKey}`}>
                {sortedMyLists.map(list => (
                  <ListRow key={list.id} list={list} />
                ))}
              </div>
            )
          )}
        </TabsContent>

        <TabsContent value="collaborative">
          {sortedCollaborativeLists.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium">No Shared Lists</h3>
              <p className="text-muted-foreground mt-2">
                Lists that others share with you will appear here
              </p>
            </div>
          ) : (
            viewMode === 'grid' ? (
              <ListCollectionGrid 
                lists={sortedCollaborativeLists}
                key={`grid-collab-${refreshKey}`}
              />
            ) : (
              <div className="space-y-4" key={`list-collab-${refreshKey}`}>
                {sortedCollaborativeLists.map(list => (
                  <ListRow key={list.id} list={list} />
                ))}
              </div>
            )
          )}
        </TabsContent>

        <TabsContent value="favorites">
          {loading.favoritedLists ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !favoritedLists || favoritedLists.items.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium">No Favorite Lists</h3>
              <p className="text-muted-foreground mt-2">
                Lists you favorite will appear here
              </p>
            </div>
          ) : (
            <>
              {viewMode === 'grid' ? (
                <ListCollectionGrid 
                  lists={favoritedLists.items}
                  key={`grid-fav-${refreshKey}`}
                />
              ) : (
                <div className="space-y-4" key={`list-fav-${refreshKey}`}>
                  {favoritedLists.items.map(list => (
                    <ListRow key={list.id} list={list} />
                  ))}
                </div>
              )}
              
              {favoritedLists.totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={favoritedLists.page === 1}
                      onClick={() => {
                        // Handle pagination
                      }}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {favoritedLists.page} of {favoritedLists.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={favoritedLists.page === favoritedLists.totalPages}
                      onClick={() => {
                        // Handle pagination
                      }}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="trending">
          {loading.trendingLists ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !trendingLists || trendingLists.items.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium">No Trending Lists</h3>
              <p className="text-muted-foreground mt-2">
                Popular lists from the community will appear here
              </p>
            </div>
          ) : (
            <>
              {viewMode === 'grid' ? (
                <ListCollectionGrid 
                  lists={trendingLists.items}
                  key={`grid-trend-${refreshKey}`}
                />
              ) : (
                <div className="space-y-4" key={`list-trend-${refreshKey}`}>
                  {trendingLists.items.map(list => (
                    <ListRow key={list.id} list={list} />
                  ))}
                </div>
              )}
              
              {trendingLists.totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={trendingLists.page === 1}
                      onClick={() => {
                        // Handle pagination
                      }}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {trendingLists.page} of {trendingLists.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={trendingLists.page === trendingLists.totalPages}
                      onClick={() => {
                        // Handle pagination
                      }}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}