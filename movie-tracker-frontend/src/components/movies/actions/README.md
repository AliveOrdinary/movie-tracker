# Unified Movie Actions System

This directory contains components for the unified movie actions system, providing a consistent way to interact with movies across the application.

## Components

### MovieActionsButton

This is the main component to use for all movie actions. It provides a versatile interface that can display in multiple ways:

```tsx
import { MovieActionsButton } from '@/components/movies/actions';

// Simple button with text and icon
<MovieActionsButton 
  movie={movie} 
  displayVariant="full" 
/>

// Icon-only version
<MovieActionsButton 
  movie={movie} 
  displayVariant="icon-only" 
  buttonVariant="ghost"
/>

// Dropdown menu version
<MovieActionsButton 
  movie={movie} 
  displayVariant="dropdown" 
/>

// Badge/pill version
<MovieActionsButton 
  movie={movie} 
  displayVariant="pill" 
/>

// Show only a specific action
<MovieActionsButton 
  movie={movie} 
  showPrimaryActionOnly 
  primaryAction="watchlist" 
/>
```

### MovieStatusIndicator

Use this component to display a movie's current status (whether it's in the watchlist, watched, rated, etc.):

```tsx
import { MovieStatusIndicator } from '@/components/movies/actions';

// Show as badges
<MovieStatusIndicator 
  movieId={movie.id} 
  variant="badge" 
/>

// Show as icons only
<MovieStatusIndicator 
  movieId={movie.id} 
  variant="icon"
  size="sm" 
/>

// Show as text
<MovieStatusIndicator 
  movieId={movie.id} 
  variant="text" 
/>

// Show as detailed section
<MovieStatusIndicator 
  movieId={movie.id} 
  variant="detailed" 
/>
```

### MovieActionsModal

This modal is used internally by the `MovieActionsButton` component, but can also be used directly for more control:

```tsx
import { MovieActionsModal } from '@/components/movies/actions';

function MyComponent() {
  const [modalOpen, setModalOpen] = useState(false);
  
  return (
    <>
      <Button onClick={() => setModalOpen(true)}>Actions</Button>
      
      <MovieActionsModal
        movie={movie}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  );
}
```

## Hooks

### useMovieStatus

This hook provides all the functionality for checking and managing a movie's status:

```tsx
import { useMovieStatus } from '@/hooks/use-movie-status';

function MovieComponent({ movieId }) {
  const {
    // Status data
    status,                // 'unwatched', 'watchlist', or 'watched'
    isInWatchlist,         // boolean
    hasWatched,            // boolean
    lastWatchDate,         // Date or null
    mostRecentWatch,       // WatchHistory object or null
    watchCount,            // number
    userRating,            // number or undefined
    averageRating,         // number
    isFavorite,            // boolean
    
    // Actions
    addToWatchlist,        // () => Promise<void>
    removeFromWatchlist,   // () => Promise<void>
    toggleWatchlist,       // () => Promise<void>
    logWatch,              // () => void
    viewWatchHistory,      // () => void
    toggleFavorite,        // () => Promise<void>
  } = useMovieStatus(movieId);
  
  // Use the data and actions as needed
}
```

### useListCategories

This hook helps with list categorization:

```tsx
import { useListCategories } from '@/hooks/use-list-categories';

function ListPage() {
  const {
    LIST_CATEGORIES,
    categorizedLists,
    categoryOptions
  } = useListCategories();
  
  // Access categorized lists
  const watchedMoviesLists = categorizedLists[LIST_CATEGORIES.WATCHED_MOVIES];
  const toWatchMoviesLists = categorizedLists[LIST_CATEGORIES.TO_WATCH_MOVIES];
  const favoriteMoviesLists = categorizedLists[LIST_CATEGORIES.FAVORITES];
  
  // Use category options for UI
  return (
    <div>
      {categoryOptions.map(option => (
        <div key={option.id}>
          <h3>{option.label}</h3>
          <p>{option.description}</p>
        </div>
      ))}
    </div>
  );
}
```

## List Creation

The CreateListForm component now includes category support:

```tsx
import { CreateListForm } from '@/components/lists/create';

function CreateListPage() {
  return (
    <CreateListForm 
      onSuccess={(listId) => {
        // Handle success
      }}
      onCancel={() => {
        // Handle cancel
      }}
    />
  );
}
```

## Movie Status Flow

The system handles the following user flows:

1. When a user marks a movie as watched, they'll be prompted to remove it from their watchlist if it's there.

2. When a user adds a movie to a "watched movies" list but hasn't logged a watch yet, they'll be prompted to log a watch.

3. Status indicators consistently show watchlist status, watch information, ratings, and favorites throughout the app.

## Migration

The old components like `MovieActionButton` and `LogWatchButton` have been updated to use this new system internally, maintaining backward compatibility while providing the enhanced functionality.
