// src/components/reviews/PostWatchReviewPrompt.tsx
'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { CREATE_REVIEW } from '@/types/graphql/reviews';
import { useToast } from '@/hooks/use-toast';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { ReviewEditor } from './ReviewEditor';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface PostWatchReviewPromptProps {
  movieId: string;
  movieTitle: string;
  watchHistoryId: string;
  watchRating?: number;
  onClose: () => void;
  visible: boolean;
}

export function PostWatchReviewPrompt({
  movieId,
  movieTitle,
  watchHistoryId,
  watchRating,
  onClose,
  visible
}: PostWatchReviewPromptProps) {
  const { toast } = useToast();
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showPrompt, setShowPrompt] = useState(visible);

  // Handle user response to the prompt
  const handleResponse = (wantsToReview: boolean) => {
    setShowPrompt(false);
    
    if (wantsToReview) {
      setShowReviewDialog(true);
    } else {
      onClose();
    }
  };

  // Handle when the review is completed
  const handleReviewComplete = () => {
    setShowReviewDialog(false);
    toast({
      title: "Review Added",
      description: "Your review has been published successfully."
    });
    onClose();
  };

  // Close the dialog if visible is false
  if (!visible && showPrompt) {
    setShowPrompt(false);
  }

  // When the user just closed the dialog without responding
  const handleAlertClose = () => {
    setShowPrompt(false);
    onClose();
  };

  return (
    <>
      {/* Initial prompt dialog */}
      <AlertDialog open={showPrompt} onOpenChange={setShowPrompt}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Share your thoughts?</AlertDialogTitle>
            <AlertDialogDescription>
              You've just logged {movieTitle} as watched. Would you like to write a review to share your thoughts with others?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => handleResponse(false)}>
              Maybe Later
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => handleResponse(true)}>
              Write Review
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Review dialog if user wants to write one */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Write a Review for {movieTitle}</DialogTitle>
            <DialogDescription>
              Share your thoughts about this movie with others.
            </DialogDescription>
          </DialogHeader>
          <ReviewEditor
            movieId={movieId}
            initialRating={watchRating}
            mode="create"
            onSuccess={handleReviewComplete}
            onCancel={() => {
              setShowReviewDialog(false);
              onClose();
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
