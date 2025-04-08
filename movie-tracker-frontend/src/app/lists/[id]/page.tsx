'use client';

import { Suspense } from 'react';
import { use } from 'react';
import { ListDetail } from '@/components/lists/ListDetail';
import { WithErrorBoundary } from '@/components/ErrorBoundary';

interface ListPageProps {
  params: {
    id: string;
  };
}

export default function ListPage({ params }: ListPageProps) {
  // Use React.use to unwrap the params promise
  const unwrappedParams = use(params);
  
  return (
    <div className="container mx-auto px-4 py-6">
      <WithErrorBoundary>
        <Suspense fallback={<div>Loading list...</div>}>
          <ListDetail listId={unwrappedParams.id} />
        </Suspense>
      </WithErrorBoundary>
    </div>
  );
}
