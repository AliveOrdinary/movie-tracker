// src/components/lists/ListCard.tsx
import Link from 'next/link';
import { formatDistance } from 'date-fns';
import { 
  MoreHorizontal, 
  Heart, 
  Users, 
  Video,
  Pencil,
  Trash,
  Share,
  X,
  RefreshCw
} from 'lucide-react';
import { List } from '@/types/graphql/lists';
import { useAuth } from '@/lib/auth/AuthContext';
import { useLists } from '@/lib/lists/ListsContext';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
} from '@/components/ui/dialog';
import { useState } from 'react';

interface ListCardProps {
  list: List;
}

export function ListCard({ list }: ListCardProps) {
  const { user } = useAuth();
  const { deleteList, favoriteList } = useLists();
  const { toast } = useToast();
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwner = user?.id === list.owner.id;

  // Callback to handle delete
  const handleDelete = async () => {
    if (isDeleting) return; // Prevent multiple clicks
    
    try {
      setIsDeleting(true);
      
      // Check if this is a standard list (like Watchlist)
      const isStandardList = list.type === 'STANDARD';
      if (isStandardList) {
        console.log(`Deleting standard list: ${list.name} (${list.id})`);
      }
      
      await deleteList(list.id);
      setShowDeleteDialog(false);
      toast({
        title: "List Deleted",
        description: `Successfully deleted "${list.name}"`
      });
    } catch (error) {
      console.error('Error deleting list:', error);
      toast({
        title: "Error Deleting List",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFavorite = async () => {
    try {
      await favoriteList(list.id);
    } catch (error) {
      console.error('Error favoriting list:', error);
    }
  };

  return (
    <>
      <Card className="relative group">
        <CardContent className="p-6 relative">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <Link 
                href={`/lists/${list.id}`}
                className="text-lg font-semibold hover:underline line-clamp-1"
              >
                {list.name}
              </Link>
              <p className="text-sm text-muted-foreground">
                by {list.owner.username}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isOwner ? (
                  <>
                    <DropdownMenuItem>
                      <Link 
                        href={`/lists/${list.id}/edit`}
                        className="flex items-center w-full"
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit List
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link 
                        href={`/lists/${list.id}/settings`}
                        className="flex items-center w-full"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Manage Access
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setShowDeleteDialog(true)}
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash className="h-4 w-4 mr-2" />
                          Delete List
                        </>
                      )}
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem onClick={handleFavorite}>
                      <Heart className="h-4 w-4 mr-2" />
                      {list.isFavorited ? 'Remove from Favorites' : 'Add to Favorites'}
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Share className="h-4 w-4 mr-2" />
                      Share List
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Description */}
          {list.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
              {list.description}
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Video className="h-4 w-4 mr-1" />
              {list.itemCount} items
            </div>
            <div className="flex items-center">
              <Heart 
                className={`h-4 w-4 mr-1 ${
                  list.isFavorited ? 'fill-primary text-primary' : ''
                }`}
                onClick={handleFavorite}
                style={{ cursor: 'pointer' }}
              />
              {list.favoriteCount}
            </div>
            {list.collaborators.length > 0 && (
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                {list.collaborators.length}
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="px-6 py-4 bg-muted/40 flex justify-between items-center">
          <div className="flex gap-2">
            <Badge variant="outline">
              {list.type === 'STANDARD' ? 'Standard' : 'Custom'}
            </Badge>
            <Badge variant="outline">
              {list.privacy.charAt(0) + list.privacy.slice(1).toLowerCase()}
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground">
            Updated {formatDistance(new Date(list.updatedAt), new Date(), { addSuffix: true })}
          </span>
        </CardFooter>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete List</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this list? This action cannot be undone.
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
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete List"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}