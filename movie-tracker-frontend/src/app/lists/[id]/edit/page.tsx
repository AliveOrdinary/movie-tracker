'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { GET_LIST_BY_ID, GET_LIST_ITEMS, UpdateListInput, ListPrivacy } from '@/types/graphql/lists';
import { useLists } from '@/lib/lists/ListsContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Trash, Search, Plus } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { SEARCH_MOVIES } from '@/types/graphql/movies';
import { TMDBMovie } from '@/types/movie';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function EditListPage() {
  const { id } = useParams();
  const router = useRouter();
  const { updateList, addListItem, removeListItem } = useLists();
  const { toast } = useToast();
  
  const [formState, setFormState] = useState({
    name: '',
    description: '',
    privacy: '' as ListPrivacy,
    category: '',
    thumbnail: ''
  });
  
  const [activeTab, setActiveTab] = useState('details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TMDBMovie[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Fetch the list data
  const { data: listData, loading: listLoading, error: listError } = useQuery(GET_LIST_BY_ID, {
    variables: { id },
    fetchPolicy: 'network-only',
  });
  
  // Fetch list items
  const { data: itemsData, loading: itemsLoading, refetch: refetchItems } = useQuery(GET_LIST_ITEMS, {
    variables: { listId: id },
    skip: activeTab !== 'items',
  });
  
  // Search for movies
  const { data: searchData, loading: searchLoading } = useQuery(SEARCH_MOVIES, {
    variables: { query: searchQuery, page: 1 },
    skip: !searchQuery || !isSearching,
  });
  
  // Update form state when list data is loaded
  useEffect(() => {
    if (listData?.list) {
      const { name, description, privacy, category, thumbnail } = listData.list;
      setFormState({
        name: name || '',
        description: description || '',
        privacy: privacy as ListPrivacy,
        category: category || '',
        thumbnail: thumbnail || ''
      });
    }
  }, [listData]);
  
  // Update search results when search data changes
  useEffect(() => {
    if (searchData?.searchMovies) {
      setSearchResults(searchData.searchMovies);
    }
  }, [searchData]);
  
  // Form submission handler
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    
    try {
      const input: UpdateListInput = {
        id: id as string,
        name: formState.name,
        description: formState.description || undefined,
        privacy: formState.privacy,
        category: formState.category || undefined,
        thumbnail: formState.thumbnail || undefined
      };
      
      await updateList(input);
      
      toast({
        title: "Success",
        description: "List updated successfully",
      });
      
      router.push(`/lists/${id}`);
    } catch (error) {
      console.error('Error updating list:', error);
      
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update list",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Form input change handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };
  
  // Select change handler
  const handleSelectChange = (name: string, value: string) => {
    setFormState(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearching(true);
    } else {
      setIsSearching(false);
      setSearchResults([]);
    }
  };
  
  // Handle adding a movie to the list
  const handleAddMovie = async (movieId: number) => {
    try {
      await addListItem({
        listId: id as string,
        movieId: movieId
      });
      
      toast({
        title: "Success",
        description: "Movie added to list",
      });
      
      // Refetch list items to update the UI
      refetchItems();
      
      // Clear search results
      setSearchQuery('');
      setSearchResults([]);
      setIsSearching(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add movie to list",
      });
    }
  };
  
  // Handle removing a movie from the list
  const handleRemoveMovie = async (itemId: string) => {
    try {
      await removeListItem(id as string, itemId);
      
      toast({
        title: "Success",
        description: "Movie removed from list",
      });
      
      // Refetch list items to update the UI
      refetchItems();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove movie from list",
      });
    }
  };
  
  if (listLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  if (listError || !listData?.list) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Error</h1>
          <p className="mb-4">Failed to load list data</p>
          <Button onClick={() => router.push('/lists')}>
            Return to Lists
          </Button>
        </div>
      </div>
    );
  }
  
  const list = listData.list;
  const listItems = itemsData?.listItems || [];
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => router.push(`/lists/${id}`)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
        </Button>
        
        <h1 className="text-3xl font-bold">Edit List</h1>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">List Details</TabsTrigger>
          <TabsTrigger value="items">Manage Items</TabsTrigger>
          <TabsTrigger value="collaborators">Collaborators</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details">
          <Card className="mt-6">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">List Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formState.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formState.description}
                    onChange={handleInputChange}
                    placeholder="Add a description (optional)"
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="privacy">Privacy</Label>
                  <Select
                    value={formState.privacy}
                    onValueChange={(value) => handleSelectChange('privacy', value)}
                  >
                    <SelectTrigger id="privacy">
                      <SelectValue placeholder="Select privacy level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ListPrivacy.PRIVATE}>Private (Only you and collaborators)</SelectItem>
                      <SelectItem value={ListPrivacy.PUBLIC}>Public (Everyone)</SelectItem>
                      <SelectItem value={ListPrivacy.FOLLOWING}>Followers Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    name="category"
                    value={formState.category}
                    onChange={handleInputChange}
                    placeholder="Add a category (optional)"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="thumbnail">Thumbnail URL</Label>
                  <Input
                    id="thumbnail"
                    name="thumbnail"
                    value={formState.thumbnail}
                    onChange={handleInputChange}
                    placeholder="Add a thumbnail URL (optional)"
                  />
                  {formState.thumbnail && (
                    <div className="mt-2 h-32 w-48 bg-muted rounded overflow-hidden">
                      <img 
                        src={formState.thumbnail} 
                        alt="Thumbnail preview" 
                        className="h-full w-full object-cover"
                        onError={(e) => (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Invalid+URL'}
                      />
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end pt-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto"
                  >
                    {isSubmitting ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="items">
          <Card className="mt-6">
            <CardContent className="pt-6">
              {/* Search Form */}
              <div className="mb-6">
                <h2 className="text-lg font-medium mb-3">Add Movies</h2>
                <form onSubmit={handleSearch} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      type="text"
                      placeholder="Search for movies..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-full"
                    />
                  </div>
                  <Button type="submit" disabled={searchLoading}>
                    {searchLoading ? 'Searching...' : 'Search'}
                  </Button>
                </form>
              </div>
              
              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-medium mb-3">Search Results</h3>
                  <ScrollArea className="h-80">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {searchResults.map((movie) => (
                        <div key={movie.id} className="flex border rounded-md p-2">
                          <div className="w-12 h-18 bg-muted mr-3 flex-shrink-0 rounded overflow-hidden">
                            {movie.poster_path ? (
                              <img 
                                src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`} 
                                alt={movie.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                                No Image
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm line-clamp-1">{movie.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {movie.release_date ? new Date(movie.release_date).getFullYear() : 'Unknown'}
                            </p>
                            <p className="text-xs line-clamp-1 mt-1 text-muted-foreground">{movie.overview || 'No description'}</p>
                            <Button 
                              size="sm" 
                              className="mt-2 h-7"
                              onClick={() => handleAddMovie(parseInt(movie.id))}
                            >
                              <Plus className="h-3 w-3 mr-1" /> Add
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
              
              {/* Current List Items */}
              <div>
                <h2 className="text-lg font-medium mb-3">Current Movies</h2>
                
                {itemsLoading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : listItems.length === 0 ? (
                  <Alert>
                    <AlertDescription>
                      This list doesn't have any movies yet. Search above to add movies.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-3">
                    {listItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-center border rounded-md p-3">
                        <div className="flex items-center">
                          <div className="mr-3 font-medium">
                            #{item.order + 1}
                          </div>
                          <div>
                            <p>Movie ID: {item.movieId}</p>
                            <p className="text-xs text-muted-foreground">
                              Added by {item.addedBy.username}
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleRemoveMovie(item.id)}
                        >
                          <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="collaborators">
          <Card className="mt-6">
            <CardContent className="pt-6">
              <h2 className="text-lg font-medium mb-3">Manage Collaborators</h2>
              
              {list.collaborators.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    No collaborators yet. Add users to collaborate on this list.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  {list.collaborators.map((collaborator) => (
                    <div key={collaborator.id} className="flex justify-between items-center border rounded-md p-3">
                      <div>
                        <p className="font-medium">{collaborator.user.username}</p>
                        <p className="text-xs text-muted-foreground">
                          Permissions: {collaborator.permissions.join(', ')}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => {/* Remove collaborator */}}
                      >
                        <Trash className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-6">
                <h3 className="text-md font-medium mb-3">Add Collaborator</h3>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter username or email"
                    className="flex-1"
                  />
                  <Button>
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Collaborators can view, add, or remove items from this list depending on their permissions.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}