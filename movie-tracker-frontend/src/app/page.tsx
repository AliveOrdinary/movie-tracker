// src/app/page.tsx
import { Metadata } from 'next';
import { MovieGrid } from '@/components/movies/MovieGrid';
import { HeroSection } from '@/components/movies/HeroSection';

export const metadata: Metadata = {
  title: 'CineTrack - Track Your Favorite Movies',
  description: 'Discover and track your favorite movies with CineTrack',
};

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <section className="py-8 md:py-12">
        <MovieGrid showSearch showFilters />
      </section>
    </div>
  );
}