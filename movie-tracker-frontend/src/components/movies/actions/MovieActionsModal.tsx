import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  PlusCircle, 
  CheckCircle, 
  Clock, 
  ListPlus, 
  Star, 
  Heart, 
  CalendarIcon,
  Search,
  Loader2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useMovieStatus } from '@/hooks/use-movie-status';
import { useLists } from '@/lib/lists/ListsContext';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { ListType, ListPrivacy } from '@/types/graphql/lists';
import { useToast } from '@/hooks/use-toast';
import { debounce } from 'lodash';

interface MovieActionsModalProps {
  movie: {
    id: string;
    tmdbId: number;
    title: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MovieActionsModal({ 
  movie,
  open,
  onOpenChange 
}: MovieActionsModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [newListName, setNewListName] = useState('');
  const [newListCategory, setNewListCategory] = useState('custom');
  const [isAddingToList, setIsAddingToList] = useState(false);
  const [isCreatingList, setIsCreatingList] = useState(false);
  
  // Get movie status using our custom hook
  const { 
    status,
    isInWatchlist,
    hasWatched,
    lastWatchDate,
    mostRecentWatch,
    isFavorite,
    toggleWatchlist,
    logWatch,
    viewWatchHistory,
    toggleFavorite,
    checkAndPromptWatchlistRemoval
  } = useMovieStatus(movie.id);
  
  // Get lists data
  const { 
    myLists, 
    loading: listsLoading, 
    bulkAddMovies, 
    createList 
  } = useLists();
  
  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setSearchTerm('');
      setSelectedListId(null);
      setNewListName('');
      setNewListCategory('custom');
    }
  }, [open]);
  
  // Filter lists based on search term
  const filteredLists = React.useMemo(() => 
    myLists.filter(list => 
      list.name.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [myLists, searchTerm]
  );
  
  // Find standard watchlist
  const watchlist = React.useMemo(() => 
    myLists.find(list => 
      list.type === ListType.STANDARD && 
      list.name === 'Watchlist'
    ),
    [myLists]
  );
  
  // Get custom lists
  const customLists = React.useMemo(() => 
    myLists.filter(list => 
      list.type === ListType.CUSTOM
    ),
    [myLists]
  );
  
  // Check if movie is already in a custom list
  const getIsInList = (listId: string) => {
    const list = myLists.find(l => l.id === listId);
    if (!list || !list.items) return false;
    
    return list.items.some(item => 
      String(item.movieId) === String(movie.tmdbId)
    );
  };
  
  // Handle adding to a list
  const handleAddToList = async () => {
    if (!selectedListId) {
      toast({
        title: "No List Selected",
        description: "Please select a list first",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsAddingToList(true);
      
      await bulkAddMovies(selectedListId, [movie.tmdbId]);
      
      toast({
        title: "Success",
        description: `Added "${movie.title}" to list`,
      });
      
      onOpenChange(false);
      
      // If the user has watched this movie and it's in their watchlist,
      // suggest removing it from watchlist
      checkAndPromptWatchlistRemoval();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error 
          ? error.message 
          : "Failed to add movie to list",
        variant: "destructive"
      });
    } finally {
      setIsAddingToList(false);
    }
  };
  
  // Handle creating a new list and adding the movie to it
  const handleCreateAndAddToList = async () => {
    if (!newListName.trim()) {
      toast({
        title: "Invalid List Name",
        description: "Please enter a valid list name",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsCreatingList(true);
      
      // Determine list category based on selection
      let category: string;
      switch (newListCategory) {
        case 'watched_movies':
          category = 'watched_movies';
          break;
        case 'to_watch_movies':
          category = 'to_watch_movies';
          break;
        case 'favorites':
          category = 'favorites';
          break;
        default:
          category = 'custom';
      }
      
      // Create new list
      const newList = await createList({
        name: newListName.trim(),
        type: ListType.CUSTOM,
        privacy: ListPrivacy.PRIVATE,
        category
      });
      
      // Add movie to the new list
      await bulkAddMovies(newList.id, [movie.tmdbId]);
      
      toast({
        title: "Success",
        description: `Created list and added "${movie.title}"`,
      });
      
      onOpenChange(false);
      
      // If it's a watched list and the user hasn't logged a watch yet,
      // suggest logging a watch
      if (category === 'watched_movies' && !hasWatched) {
        toast({
          title: "Log Watch Details?",
          description: "Would you like to record when you watched this movie?",
          action: <Button variant="default" size="sm" onClick={() => router.push(`/watch-history/add/${movie.id}`)}>Log Watch</Button>,
          duration: 8000
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error 
          ? error.message 
          : "Failed to create list",
        variant: "destructive"
      });
    } finally {
      setIsCreatingList(false);
    }
  };
  
  const debounceSearch = debounce((value: string) => {
    setSearchTerm(value);
  }, 300);
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debounceSearch(e.target.value);
  };
  
  // Determine the default tab to show
  const getDefaultTab = () => {
    if (hasWatched) return 'actions';
    if (status === 'watchlist') return 'actions';
    return 'quick';
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Movie Actions</DialogTitle>
          <DialogDescription>
            Manage "{movie.title}" in your collection
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue={getDefaultTab()} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="quick">Quick Actions</TabsTrigger>
            <TabsTrigger value="lists">My Lists</TabsTrigger>
            <TabsTrigger value="new-list">New List</TabsTrigger>
          </TabsList>
          
          {/* Quick Actions Tab */}
          <TabsContent value="quick" className="space-y-4 pt-4">
            {/* Status summary */}
            <div className="flex flex-col rounded-lg border p-3 text-sm">
              <h4 className="font-medium mb-2">Current Status:</h4>
              <div className="flex flex-wrap gap-2">
                {hasWatched && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    <span>Watched</span>
                  </Badge>
                )}
                {isInWatchlist && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>On Watchlist</span>
                  </Badge>
                )}
                {!hasWatched && !isInWatchlist && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <PlusCircle className="h-3 w-3" />
                    <span>Not in collection</span>
                  </Badge>
                )}
                {isFavorite && (
                  <Badge variant="secondary" className="flex items-center gap-1 bg-pink-500/10 text-pink-500 hover:bg-pink-500/20 hover:text-pink-600">
                    <Heart className="h-3 w-3 fill-current" />
                    <span>Favorite</span>
                  </Badge>
                )}
              </div>
              
              {mostRecentWatch && (
                <div className="mt-2 text-muted-foreground flex items-center gap-1.5">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  <span>Last watched: {format(new Date(mostRecentWatch.watchedAt), 'MMM d, yyyy')}</span>
                </div>
              )}
              
              {mostRecentWatch?.rating && (
                <div className="mt-1 text-muted-foreground flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 text-yellow-500" />
                  <span>Rated {mostRecentWatch.rating}/5</span>
                </div>
              )}
            </div>
            
            {/* Watchlist action */}
            <Button 
              variant={isInWatchlist ? "outline" : "default"} 
              className="w-full flex items-center justify-start gap-2 h-14"
              onClick={toggleWatchlist}
            >
              {isInWatchlist ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <PlusCircle className="h-5 w-5" />
              )}
              <div className="flex flex-col items-start">
                <span className="font-medium">
                  {isInWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {isInWatchlist 
                    ? "This movie is in your watchlist" 
                    : "Add to your list of movies to watch"}
                </span>
              </div>
            </Button>
            
            <Separator />
            
            {/* Watch action */}
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-start gap-2 h-14"
              onClick={hasWatched ? viewWatchHistory : logWatch}
            >
              <Clock className="h-5 w-5" />
              <div className="flex flex-col items-start">
                <span className="font-medium">
                  {hasWatched ? "View Watch History" : "Log Watch"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {hasWatched 
                    ? "See when you watched this movie" 
                    : "Record that you've watched this movie"}
                </span>
              </div>
            </Button>
            
            {hasWatched && (
              <Button 
                variant={isFavorite ? "outline" : "default"} 
                className={`w-full flex items-center justify-start gap-2 h-14 ${isFavorite ? 'border-pink-500/50' : ''}`}
                onClick={toggleFavorite}
              >
                <Heart className={`h-5 w-5 ${isFavorite ? 'fill-pink-500 text-pink-500' : ''}`} />
                <div className="flex flex-col items-start">
                  <span className="font-medium">
                    {isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {isFavorite 
                      ? "This is marked as a favorite" 
                      : "Mark this movie as a favorite"}
                  </span>
                </div>
              </Button>
            )}
          </TabsContent>
          
          {/* My Lists Tab */}
          <TabsContent value="lists" className="space-y-4 pt-4">
            <div className="relative">
              <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search your lists..."
                className="pl-8"
                onChange={handleSearchChange}
              />
            </div>
            
            {listsLoading ? (
              <div className="py-8 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredLists.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">No lists found</p>
              </div>
            ) : (
              <ScrollArea className="h-56 pr-4">
                <div className="space-y-2">
                  {filteredLists.map((list) => {
                    const isInList = getIsInList(list.id);
                    return (
                      <Button
                        key={list.id}
                        variant={selectedListId === list.id ? "default" : "outline"}
                        className={`w-full justify-between text-left h-auto py-3 ${isInList ? 'border-green-500/30' : ''}`}
                        onClick={() => setSelectedListId(list.id)}
                      >
                        <div className="flex items-center gap-2">
                          <ListPlus className="h-4 w-4 flex-shrink-0" />
                          <div className="flex flex-col">
                            <span className="font-medium">{list.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {list.type === ListType.STANDARD ? 'Standard List' : 'Custom List'} 
                              • {list.itemCount || 0} {list.itemCount === 1 ? 'item' : 'items'}
                            </span>
                          </div>
                        </div>
                        {isInList && (
                          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            In list
                          </Badge>
                        )}
                      </Button>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
            
            <Button 
              className="w-full" 
              disabled={!selectedListId || isAddingToList}
              onClick={handleAddToList}
            >
              {isAddingToList ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <PlusCircle className="mr-2 h-4 w-4" />
              )}
              Add to Selected List
            </Button>
          </TabsContent>
          
          {/* New List Tab */}
          <TabsContent value="new-list" className="space-y-4 pt-4">
            <div className="space-y-4">
              <Input
                placeholder="Enter new list name..."
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
              />
              
              <div className="space-y-2">
                <label className="text-sm font-medium">List Category</label>
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    type="button"
                    variant={newListCategory === 'to_watch_movies' ? 'default' : 'outline'}
                    className="justify-start"
                    onClick={() => setNewListCategory('to_watch_movies')}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Movies To Watch
                  </Button>
                  
                  <Button
                    type="button"
                    variant={newListCategory === 'watched_movies' ? 'default' : 'outline'}
                    className="justify-start"
                    onClick={() => setNewListCategory('watched_movies')}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Watched Movies
                  </Button>
                  
                  <Button
                    type="button"
                    variant={newListCategory === 'favorites' ? 'default' : 'outline'}
                    className="justify-start"
                    onClick={() => setNewListCategory('favorites')}
                  >
                    <Heart className="mr-2 h-4 w-4" />
                    Favorite Movies
                  </Button>
                  
                  <Button
                    type="button"
                    variant={newListCategory === 'custom' ? 'default' : 'outline'}
                    className="justify-start"
                    onClick={() => setNewListCategory('custom')}
                  >
                    <ListPlus className="mr-2 h-4 w-4" />
                    Custom List
                  </Button>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground">
                This will create a new private list with this movie
              </p>
            </div>
            
            <Button 
              className="w-full" 
              disabled={!newListName.trim() || isCreatingList}
              onClick={handleCreateAndAddToList}
            >
              {isCreatingList ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <PlusCircle className="mr-2 h-4 w-4" />
              )}
              Create List & Add Movie
            </Button>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="sm:justify-start">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}