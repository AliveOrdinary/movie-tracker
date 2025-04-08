// src/app/page.tsx
'use client';

import { MovieGrid } from '@/components/movies/MovieGrid';
import { HeroSection } from '@/components/movies/HeroSection';
import { WithErrorBoundary } from '@/components/ErrorBoundary';
import { Suspense } from 'react';
import { MovieGridSkeleton } from '@/components/movies/MovieGridSkeleton';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <section className="py-8 md:py-12">
        <WithErrorBoundary>
          <Suspense fallback={<MovieGridSkeleton />}>
            <MovieGrid showSearch showFilters />
          </Suspense>
        </WithErrorBoundary>
      </section>
    </div>
  );
}
