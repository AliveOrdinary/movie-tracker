// src/components/lists/ListSelectionModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogClose 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import {
  ListTodo,
  Plus,
  Clock,
  Check,
  Search,
  Loader2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useLists } from '@/lib/lists/ListsContext';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { ListType, ListPrivacy } from '@/types/graphql/lists';

interface ListSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movieId: number;
  movieTitle: string;
}

export function ListSelectionModal({ 
  open, 
  onOpenChange,
  movieId,
  movieTitle
}: ListSelectionModalProps) {
  const { 
    myLists, 
    loading, 
    bulkAddMovies, 
    createList 
  } = useLists();
  const { toast } = useToast();
  const router = useRouter();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [isAddingToList, setIsAddingToList] = useState(false);
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListName, setNewListName] = useState('');
  
  // Reset selected list when modal opens
  useEffect(() => {
    if (open) {
      setSelectedListId(null);
      setSearchTerm('');
      setNewListName('');
    }
  }, [open]);
  
  // Filter lists based on search term
  const filteredLists = myLists.filter(list => 
    list.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Find standard watchlist
  const watchlist = myLists.find(list => 
    list.type === 'STANDARD' && list.name === 'Watchlist'
  );
  
  // Get custom lists
  const customLists = myLists.filter(list => 
    list.type === 'CUSTOM'
  );
  
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
      
      await bulkAddMovies(selectedListId, [movieId]);
      
      toast({
        title: "Success",
        description: `Added "${movieTitle}" to list`,
      });
      
      onOpenChange(false);
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
      
      // Create new list
      const newList = await createList({
        name: newListName.trim(),
        type: ListType.CUSTOM,
        privacy: ListPrivacy.PRIVATE
      });
      
      // Add movie to the new list
      await bulkAddMovies(newList.id, [movieId]);
      
      toast({
        title: "Success",
        description: `Created list and added "${movieTitle}"`,
      });
      
      onOpenChange(false);
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
  
  const handleAddToWatchlist = async () => {
    if (!watchlist) {
      // If watchlist doesn't exist, create one
      try {
        setIsAddingToList(true);
        
        const newWatchlist = await createList({
          name: "Watchlist",
          type: ListType.STANDARD,
          privacy: ListPrivacy.PRIVATE
        });
        
        await bulkAddMovies(newWatchlist.id, [movieId]);
        
        toast({
          title: "Success",
          description: `Added "${movieTitle}" to watchlist`,
        });
        
        onOpenChange(false);
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error 
            ? error.message 
            : "Failed to create watchlist",
          variant: "destructive"
        });
      } finally {
        setIsAddingToList(false);
      }
      return;
    }
    
    try {
      setIsAddingToList(true);
      
      await bulkAddMovies(watchlist.id, [movieId]);
      
      toast({
        title: "Success",
        description: `Added "${movieTitle}" to watchlist`,
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error 
          ? error.message 
          : "Failed to add movie to watchlist",
        variant: "destructive"
      });
    } finally {
      setIsAddingToList(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Save Movie</DialogTitle>
          <DialogDescription>
            Add "{movieTitle}" to a list or create a new list
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="quick" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="quick">Quick Add</TabsTrigger>
            <TabsTrigger value="my-lists">My Lists</TabsTrigger>
            <TabsTrigger value="new-list">New List</TabsTrigger>
          </TabsList>
          
          {/* Quick Add Tab */}
          <TabsContent value="quick" className="mt-4 space-y-4">
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-start gap-2 h-16"
              onClick={handleAddToWatchlist}
              disabled={isAddingToList}
            >
              {isAddingToList ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Clock className="h-5 w-5" />
              )}
              <div className="flex flex-col items-start">
                <span className="font-medium">Watchlist</span>
                <span className="text-xs text-muted-foreground">
                  Standard list for movies you want to watch
                </span>
              </div>
            </Button>
            
            <Separator />
            
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-start gap-2 h-16"
              onClick={() => router.push(`/watch-history/add/${movieId}`)}
            >
              <Check className="h-5 w-5" />
              <div className="flex flex-col items-start">
                <span className="font-medium">Log Watch</span>
                <span className="text-xs text-muted-foreground">
                  Record that you've watched this movie
                </span>
              </div>
            </Button>
          </TabsContent>
          
          {/* My Lists Tab */}
          <TabsContent value="my-lists" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search your lists..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {loading.myLists ? (
              <div className="py-8 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredLists.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">No lists found</p>
              </div>
            ) : (
              <ScrollArea className="h-[200px] pr-4">
                <div className="space-y-2">
                  {filteredLists.map((list) => (
                    <Button
                      key={list.id}
                      variant={selectedListId === list.id ? "default" : "outline"}
                      className="w-full justify-start text-left h-auto py-3"
                      onClick={() => setSelectedListId(list.id)}
                    >
                      <div className="flex items-center gap-2">
                        <ListTodo className="h-4 w-4 flex-shrink-0" />
                        <div className="flex flex-col">
                          <span className="font-medium">{list.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {list.type === 'STANDARD' ? 'Standard List' : 'Custom List'} 
                            • {list.itemCount || 0} {list.itemCount === 1 ? 'item' : 'items'}
                          </span>
                        </div>
                      </div>
                    </Button>
                  ))}
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
                <Plus className="mr-2 h-4 w-4" />
              )}
              Add to Selected List
            </Button>
          </TabsContent>
          
          {/* New List Tab */}
          <TabsContent value="new-list" className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="Enter new list name..."
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
              />
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
                <Plus className="mr-2 h-4 w-4" />
              )}
              Create List & Add Movie
            </Button>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="flex items-center justify-between">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}