// src/hooks/reviews/use-review-reactions.ts
import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { ADD_REACTION, REMOVE_REACTION, ReactionType } from '@/types/graphql/reviews';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth/AuthContext';

export function useReviewReactions(reviewId: string) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const [addReaction] = useMutation(ADD_REACTION, {
    onError: (error) => {
      console.error('Error adding reaction:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to add reaction',
        description: error.message,
      });
    },
  });

  const [removeReaction] = useMutation(REMOVE_REACTION, {
    onError: (error) => {
      console.error('Error removing reaction:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to remove reaction',
        description: error.message,
      });
    },
  });

  const toggleReaction = async (reactionType: ReactionType, currentReaction?: ReactionType) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Required',
        description: 'You must be logged in to react to reviews',
      });
      return;
    }

    try {
      setIsLoading(true);

      // If already has the same reaction, remove it
      if (currentReaction === reactionType) {
        await removeReaction({
          variables: {
            input: {
              reviewId,
              type: reactionType,
            },
          },
        });
      } else {
        // If has a different reaction, remove it first and add the new one
        if (currentReaction) {
          await removeReaction({
            variables: {
              input: {
                reviewId,
                type: currentReaction,
              },
            },
          });
        }

        // Add the new reaction
        await addReaction({
          variables: {
            input: {
              reviewId,
              type: reactionType,
            },
          },
        });
      }
    } catch (error) {
      console.error('Error toggling reaction:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    toggleReaction,
    isLoading,
  };
}
