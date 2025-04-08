'use client';

import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AddWatchForm } from '@/components/watch-history/AddWatchForm';

export default function AddWatchPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      // Redirect to login if not authenticated
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Log a Watch</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Add to Watch History</CardTitle>
          <CardDescription>
            Record a movie you've watched with details about your experience.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AddWatchForm />
        </CardContent>
      </Card>
    </div>
  );
}
