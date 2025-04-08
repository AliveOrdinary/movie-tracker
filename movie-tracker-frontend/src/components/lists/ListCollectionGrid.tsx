'use client';

import { List } from '@/types/graphql/lists';
import { ListCard } from './ListCard';

interface ListCollectionGridProps {
  lists: List[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export function ListCollectionGrid({ 
  lists, 
  isLoading = false,
  emptyMessage = "No lists found"
}: ListCollectionGridProps) {
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="h-52 animate-pulse bg-muted rounded-md"></div>
        ))}
      </div>
    );
  }
  
  if (!lists || lists.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg font-medium mb-3">{emptyMessage}</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {lists.map((list) => (
        <ListCard key={list.id} list={list} />
      ))}
    </div>
  );
}