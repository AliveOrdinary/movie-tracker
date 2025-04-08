import { useMemo } from 'react';
import { useLists } from '@/lib/lists/ListsContext';
import { ListType } from '@/types/graphql/lists';

export const LIST_CATEGORIES = {
  WATCHED_MOVIES: 'watched_movies',
  TO_WATCH_MOVIES: 'to_watch_movies',
  FAVORITES: 'favorites',
  CUSTOM: 'custom'
};

export type ListCategory = typeof LIST_CATEGORIES[keyof typeof LIST_CATEGORIES];

export interface ListCategoryOption {
  id: ListCategory;
  label: string;
  description: string;
  icon: string;
}

/**
 * Custom hook for working with list categories
 */
export function useListCategories() {
  const { myLists } = useLists();
  
  // Get all available categories from user's lists
  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    
    myLists.forEach(list => {
      if (list.category) {
        categories.add(list.category);
      }
    });
    
    return Array.from(categories);
  }, [myLists]);
  
  // Get lists by category
  const getListsByCategory = (category: string) => {
    return myLists.filter(list => list.category === category);
  };
  
  // Get lists by type
  const getListsByType = (type: ListType) => {
    return myLists.filter(list => list.type === type);
  };
  
  // Get categorized lists
  const categorizedLists = useMemo(() => {
    const result = {
      [LIST_CATEGORIES.WATCHED_MOVIES]: getListsByCategory(LIST_CATEGORIES.WATCHED_MOVIES),
      [LIST_CATEGORIES.TO_WATCH_MOVIES]: getListsByCategory(LIST_CATEGORIES.TO_WATCH_MOVIES),
      [LIST_CATEGORIES.FAVORITES]: getListsByCategory(LIST_CATEGORIES.FAVORITES),
      standard: getListsByType(ListType.STANDARD),
      custom: getListsByType(ListType.CUSTOM).filter(list => 
        !list.category || list.category === LIST_CATEGORIES.CUSTOM
      ),
      all: myLists
    };
    
    return result;
  }, [myLists]);
  
  // Predefined category options for UI
  const categoryOptions: ListCategoryOption[] = [
    {
      id: LIST_CATEGORIES.TO_WATCH_MOVIES,
      label: 'Movies To Watch',
      description: 'Movies you plan to watch in the future',
      icon: 'Clock'
    },
    {
      id: LIST_CATEGORIES.WATCHED_MOVIES,
      label: 'Watched Movies',
      description: 'Movies you have already seen',
      icon: 'CheckCircle'
    },
    {
      id: LIST_CATEGORIES.FAVORITES,
      label: 'Favorite Movies',
      description: 'Your most beloved movies',
      icon: 'Heart'
    },
    {
      id: LIST_CATEGORIES.CUSTOM,
      label: 'Custom List',
      description: 'Create a list for any purpose',
      icon: 'ListPlus'
    }
  ];
  
  return {
    LIST_CATEGORIES,
    availableCategories,
    getListsByCategory,
    getListsByType,
    categorizedLists,
    categoryOptions
  };
}