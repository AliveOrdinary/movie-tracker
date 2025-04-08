// src/components/lists/ListRow.tsx
import Link from 'next/link';
import { formatDistance } from 'date-fns';
import { 
  MoreHorizontal, 
  Heart, 
  Users, 
  Video,
  ChevronRight,
  Pencil,
  Trash,
  Share,
  RefreshCw
} from 'lucide-react';
import { List } from '@/types/graphql/lists';
import { useAuth } from '@/lib/auth/AuthContext';
import { useLists } from '@/lib/lists/ListsContext';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
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

interface ListRowProps {
  list: List;
}

export function ListRow({ list }: ListRowProps) {
  const { user } = useAuth();
  const { favoriteList, deleteList } = useLists();
  const { toast } = useToast();
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const isOwner = user?.id === list.owner.id;

  const handleFavorite = async () => {
    try {
      await favoriteList(list.id);
    } catch (error) {
      console.error('Error favoriting list:', error);
    }
  };

  // Handle delete with safeguards against multiple clicks
  const handleDelete = async () => {
    if (isDeleting) return;
    
    try {
      setIsDeleting(true);
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

  return (
    <>
      <div className="flex items-center justify-between p-4 hover:bg-accent rounded-lg transition-colors">
        <div className="flex items-center flex-1 min-w-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <Link 
                href={`/lists/${list.id}`}
                className="text-lg font-semibold hover:underline truncate"
              >
                {list.name}
              </Link>
              <div className="flex gap-2">
                <Badge variant="outline">
                  {list.type === 'STANDARD' ? 'Standard' : 'Custom'}
                </Badge>
                <Badge variant="outline">
                  {list.privacy.charAt(0) + list.privacy.slice(1).toLowerCase()}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-1">
              <p className="text-sm text-muted-foreground">
                by {list.owner.username}
              </p>
              <span className="text-sm text-muted-foreground">
                Updated {formatDistance(new Date(list.updatedAt), new Date(), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Video className="h-4 w-4 mr-1" />
              {list.itemCount}
            </div>
            <button 
              onClick={handleFavorite}
              className="flex items-center hover:text-primary transition-colors"
            >
              <Heart 
                className={`h-4 w-4 mr-1 ${
                  list.isFavorited ? 'fill-primary text-primary' : ''
                }`}
              />
              {list.favoriteCount}
            </button>
            {list.collaborators.length > 0 && (
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                {list.collaborators.length}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Removed standalone delete button */}
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
            <Link href={`/lists/${list.id}`}>
              <Button variant="ghost" size="icon">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

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