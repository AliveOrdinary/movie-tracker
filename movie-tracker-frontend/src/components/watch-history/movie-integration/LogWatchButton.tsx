import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { MovieActionsButton } from '@/components/movies/actions';

interface LogWatchButtonProps extends ButtonProps {
  movieId: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  iconOnly?: boolean;
}

export function LogWatchButton({ 
  movieId, 
  size = 'default', 
  variant = 'outline',
  iconOnly = false,
  className,
  ...props 
}: LogWatchButtonProps) {
  // Map the old props to our new component
  return (
    <MovieActionsButton
      movie={{ id: movieId, tmdbId: parseInt(movieId), title: '' }}
      displayVariant={iconOnly ? 'icon-only' : 'compact'}
      buttonVariant={variant}
      size={size}
      className={className}
      showPrimaryActionOnly
      primaryAction="watch"
      {...props}
    />
  );
}
