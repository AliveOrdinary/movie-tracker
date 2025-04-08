// src/components/reviews/ReactionSelector.tsx
'use client';

import { useState } from 'react';
import { 
  ThumbsUp, 
  Heart, 
  Smile, 
  Check, 
  X, 
  Frown, 
  Angry,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useReviewReactions } from '@/hooks/reviews/use-review-reactions';
import { ReactionType, ReactionStat } from '@/types/graphql/reviews';
import { useAuth } from '@/lib/auth/AuthContext';
import { cn } from '@/lib/utils';

interface ReactionSelectorProps {
  reviewId: string;
  reactionStats?: ReactionStat[];
  userReaction?: ReactionType;
  reactionCount?: number;
  onReactionChange?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
}

type ReactionOption = {
  type: ReactionType;
  label: string;
  icon: React.ReactNode;
  activeColor: string;
};

const reactionOptions: ReactionOption[] = [
  { 
    type: ReactionType.LIKE, 
    label: 'Like', 
    icon: <ThumbsUp className="h-4 w-4" />, 
    activeColor: 'text-blue-500 fill-blue-500' 
  },
  { 
    type: ReactionType.LOVE, 
    label: 'Love', 
    icon: <Heart className="h-4 w-4" />, 
    activeColor: 'text-red-500 fill-red-500' 
  },
  { 
    type: ReactionType.LAUGH, 
    label: 'Laugh', 
    icon: <Smile className="h-4 w-4" />, 
    activeColor: 'text-yellow-500 fill-yellow-500' 
  },
  { 
    type: ReactionType.AGREE, 
    label: 'Agree', 
    icon: <Check className="h-4 w-4" />, 
    activeColor: 'text-green-500 fill-green-500' 
  },
  { 
    type: ReactionType.DISAGREE, 
    label: 'Disagree', 
    icon: <X className="h-4 w-4" />, 
    activeColor: 'text-purple-500 fill-purple-500' 
  },
  { 
    type: ReactionType.SAD, 
    label: 'Sad', 
    icon: <Frown className="h-4 w-4" />, 
    activeColor: 'text-gray-500 fill-gray-500' 
  },
  { 
    type: ReactionType.ANGRY, 
    label: 'Angry', 
    icon: <Angry className="h-4 w-4" />, 
    activeColor: 'text-orange-500 fill-orange-500' 
  },
];

export function ReactionSelector({
  reviewId,
  reactionStats = [],
  userReaction,
  reactionCount = 0,
  onReactionChange,
  size = 'md',
  showCount = true,
}: ReactionSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toggleReaction, isLoading } = useReviewReactions(reviewId);
  const { user } = useAuth();

  // Get the active reaction details
  const activeReaction = userReaction 
    ? reactionOptions.find(r => r.type === userReaction) 
    : undefined;

  // Get button size based on prop
  const getButtonSize = () => {
    switch (size) {
      case 'sm': return 'h-8 px-2 text-xs';
      case 'lg': return 'h-11 px-4 text-base';
      default: return 'h-9 px-3 text-sm';
    }
  };

  // Get icon size based on prop
  const getIconSize = () => {
    switch (size) {
      case 'sm': return 'h-3 w-3 mr-1';
      case 'lg': return 'h-5 w-5 mr-2';
      default: return 'h-4 w-4 mr-2';
    }
  };

  // Handle reaction click
  const handleReactionClick = async (type: ReactionType) => {
    await toggleReaction(type, userReaction);
    setIsOpen(false);
    onReactionChange?.();
  };

  // If user not logged in, use simplified button
  if (!user) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn("gap-1", getButtonSize())}
            >
              <ThumbsUp className={cn("text-muted-foreground", getIconSize())} />
              {showCount && reactionCount > 0 && (
                <span className="text-muted-foreground">{reactionCount}</span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Sign in to react</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={userReaction ? "outline" : "ghost"}
          size="sm"
          className={cn(
            "gap-1 transition-colors", 
            getButtonSize(),
            activeReaction?.activeColor
          )}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className={cn("animate-spin text-muted-foreground", getIconSize())} />
          ) : activeReaction ? (
            activeReaction.icon
          ) : (
            <ThumbsUp className={cn("text-muted-foreground", getIconSize())} />
          )}
          
          {userReaction ? (
            <span>{activeReaction?.label}</span>
          ) : (
            <span>React</span>
          )}
          
          {showCount && reactionCount > 0 && (
            <span className="ml-1 text-muted-foreground">({reactionCount})</span>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-auto p-2" align="start">
        <div className="flex gap-1">
          {reactionOptions.map((reaction) => (
            <TooltipProvider key={reaction.type}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-9 w-9 rounded-full",
                      userReaction === reaction.type && reaction.activeColor
                    )}
                    onClick={() => handleReactionClick(reaction.type)}
                  >
                    {reaction.icon}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{reaction.label}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}