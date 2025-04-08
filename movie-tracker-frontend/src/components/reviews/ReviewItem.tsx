// src/components/reviews/ReviewItem.tsx
'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { formatDistanceToNow } from 'date-fns';
import { 
  Star, 
  MoreHorizontal, 
  Edit, 
  Trash, 
  Flag, 
  Eye,
  EyeOff
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth/AuthContext';
import { ReactionSelector } from './ReactionSelector';
import { ReviewEditor } from './ReviewEditor';
import { ReactionStat, ReactionType, Review } from '@/types/graphql/reviews';
import { DELETE_REVIEW, FLAG_REVIEW } from '@/types/graphql/reviews';
import { GET_MOVIE_REVIEWS } from '@/types/graphql/movies';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface ReviewItemProps {
  review: Review;
  onUpdate?: () => void;
  showMovieInfo?: boolean;
  simplifiedView?: boolean;
}

export function ReviewItem({ 
  review, 
  onUpdate, 
  showMovieInfo = false,
  simplifiedView = false
}: ReviewItemProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isEditMode, setIsEditMode] = useState(false);
  const [showFullContent, setShowFullContent] = useState(!review.containsSpoilers);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showFlagDialog, setShowFlagDialog] = useState(false);
  const [flagReason, setFlagReason] = useState('');

  // Delete review mutation
  const [deleteReview, { loading: deleteLoading }] = useMutation(DELETE_REVIEW, {
    onCompleted: () => {
      toast({
        title: 'Review Deleted',
        description: 'Your review has been deleted successfully',
      });
      setShowDeleteDialog(false);
      onUpdate?.();
    },
    refetchQueries: [{ 
      query: GET_MOVIE_REVIEWS, 
      variables: { movieId: review.movie.id } 
    }],
  });

  // Flag review mutation
  const [flagReview, { loading: flagLoading }] = useMutation(FLAG_REVIEW, {
    onCompleted: () => {
      toast({
        title: 'Review Flagged',
        description: 'The review has been flagged for moderator review',
      });
      setShowFlagDialog(false);
      onUpdate?.();
    },
  });

  const handleDeleteReview = async () => {
    try {
      await deleteReview({
        variables: {
          id: review.id,
        },
      });
    } catch (error) {
      console.error('Error deleting review:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to delete review',
        description: (error as Error).message,
      });
    }
  };

  const handleFlagReview = async () => {
    try {
      await flagReview({
        variables: {
          id: review.id,
          reason: flagReason,
        },
      });
    } catch (error) {
      console.error('Error flagging review:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to flag review',
        description: (error as Error).message,
      });
    }
  };

  // Is the current user the author of this review
  const isAuthor = user?.id === review.user.id;

  // Is the review spoiler-protected and hidden
  const isSpoilerHidden = review.containsSpoilers && !showFullContent;

  // Simplified card content for compact view
  if (simplifiedView) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {showMovieInfo ? (
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{review.movie.title}</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-primary text-primary" />
                    <span>{review.rating}</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <span>{review.rating}</span>
                </div>
              )}
            </div>
            <CardDescription>
              {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {isSpoilerHidden ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">This review contains spoilers</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1"
                onClick={() => setShowFullContent(true)}
              >
                <Eye className="h-4 w-4" />
                Show Review
              </Button>
            </div>
          ) : (
            <p className="text-sm">{review.content}</p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {isEditMode ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit Your Review</CardTitle>
          </CardHeader>
          <CardContent>
            <ReviewEditor
              reviewId={review.id}
              initialRating={review.rating}
              initialContent={review.content}
              initialContainsSpoilers={review.containsSpoilers}
              mode="edit"
              onSuccess={() => {
                setIsEditMode(false);
                onUpdate?.();
              }}
              onCancel={() => setIsEditMode(false)}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <Avatar>
                  <AvatarImage src={review.user.avatarUrl} />
                  <AvatarFallback>
                    {review.user.username?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-base">
                    {review.user.username}
                  </CardTitle>
                  <CardDescription>
                    {formatDistanceToNow(new Date(review.createdAt), {
                      addSuffix: true,
                    })}
                    {review.isEdited && ' (edited)'}
                  </CardDescription>
                  
                  {/* Movie info if enabled */}
                  {showMovieInfo && (
                    <div className="mt-1 flex items-center gap-1">
                      <span className="text-sm font-medium">{review.movie.title}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-primary-foreground rounded px-2 py-1">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <span className="font-medium">{review.rating}</span>
                  <span className="text-xs text-muted-foreground">/5</span>
                </div>
                
                {review.containsSpoilers && (
                  <Badge variant="outline" className="text-yellow-500 border-yellow-500">
                    Spoilers
                  </Badge>
                )}
                
                {(isAuthor || user?.roles?.includes('ADMIN') || user?.roles?.includes('MODERATOR')) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {isAuthor && (
                        <DropdownMenuItem onClick={() => setIsEditMode(true)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Review
                        </DropdownMenuItem>
                      )}
                      
                      {isAuthor && (
                        <DropdownMenuItem 
                          onClick={() => setShowDeleteDialog(true)}
                          className="text-destructive"
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          Delete Review
                        </DropdownMenuItem>
                      )}
                      
                      {!isAuthor && (
                        <>
                          <DropdownMenuItem onClick={() => setShowFlagDialog(true)}>
                            <Flag className="h-4 w-4 mr-2" />
                            Flag Review
                          </DropdownMenuItem>
                          
                          {(user?.roles?.includes('ADMIN') || user?.roles?.includes('MODERATOR')) && (
                            <DropdownMenuSeparator />
                          )}
                          
                          {(user?.roles?.includes('ADMIN') || user?.roles?.includes('MODERATOR')) && (
                            <DropdownMenuItem 
                              onClick={() => setShowDeleteDialog(true)}
                              className="text-destructive"
                            >
                              <Trash className="h-4 w-4 mr-2" />
                              Moderate: Delete
                            </DropdownMenuItem>
                          )}
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isSpoilerHidden ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">This review contains spoilers</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1"
                  onClick={() => setShowFullContent(true)}
                >
                  <Eye className="h-4 w-4" />
                  Show Review
                </Button>
              </div>
            ) : (
              <>
                <p className="text-sm mb-4">{review.content}</p>
                
                {review.containsSpoilers && showFullContent && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-1 mb-4"
                    onClick={() => setShowFullContent(false)}
                  >
                    <EyeOff className="h-4 w-4" />
                    Hide Spoilers
                  </Button>
                )}
                
                <div className="flex items-center gap-2 mt-4">
                  <ReactionSelector 
                    reviewId={review.id}
                    reactionStats={review.reactionStats}
                    userReaction={review.userReaction as ReactionType}
                    reactionCount={review.reactionCount}
                    onReactionChange={onUpdate}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Review</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this review? This action cannot be undone.
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
              onClick={handleDeleteReview}
              disabled={deleteLoading}
            >
              {deleteLoading ? (
                <>
                  <LoadingSpinner className="mr-2" size="sm" />
                  Deleting...
                </>
              ) : (
                'Delete Review'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Flag Review Dialog */}
      <Dialog open={showFlagDialog} onOpenChange={setShowFlagDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Flag Review</DialogTitle>
            <DialogDescription>
              If you believe this review violates community guidelines, you can flag it for moderator review.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2">
            <Textarea
              placeholder="Please explain why you're flagging this review..."
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground">
              Your report will be sent to moderators for review. Thank you for helping keep our community safe.
            </p>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowFlagDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleFlagReview}
              disabled={flagLoading || !flagReason.trim()}
            >
              {flagLoading ? (
                <>
                  <LoadingSpinner className="mr-2" size="sm" />
                  Submitting...
                </>
              ) : (
                'Submit Report'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
