// src/components/movies/HeroSection.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function HeroSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <section className="relative">
      {/* Background with overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black to-black/50" />
      
      <div className="relative mx-auto px-4 py-24 md:py-32 max-w-6xl">
        <div className="flex flex-col items-center text-center space-y-8">
          <div className="space-y-4 text-white">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">
              Track Your Movie Journey
            </h1>
            <p className="text-lg md:text-xl text-gray-200 max-w-2xl mx-auto">
              Discover, track, and share your favorite movies. Create watchlists, rate films, and join a community of movie enthusiasts.
            </p>
          </div>

          <Card className="w-full max-w-2xl bg-background/95 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Discover Movies</CardTitle>
              <CardDescription>
                Search for movies by title, actor, or director
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search movies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-full"
                  />
                </div>
                <Button type="submit">Search</Button>
              </form>
            </CardContent>
          </Card>

          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="outline" size="lg" className="bg-background/95">
              Browse Popular
            </Button>
            <Button variant="outline" size="lg" className="bg-background/95">
              Top Rated
            </Button>
            <Button variant="outline" size="lg" className="bg-background/95">
              Now Playing
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}