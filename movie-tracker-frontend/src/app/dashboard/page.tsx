'use client';

import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function DashboardPage() {
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
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Welcome, {user.username}!</CardTitle>
            <CardDescription>
              You're successfully logged in to CineTrack.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Your account was created on {new Date(user.createdAt).toLocaleDateString()}</p>
            <p className="mt-2">Email: {user.email} {user.emailVerified ? '(verified)' : '(not verified)'}</p>
            <p className="mt-2">Roles: {user.roles.join(', ')}</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => router.push('/profile')}>View Profile</Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Things you can do with your account
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button className="w-full" onClick={() => router.push('/movies')}>
              Browse Movies
            </Button>
            <Button className="w-full" onClick={() => router.push('/lists')}>
              Manage Lists
            </Button>
            <Button className="w-full" onClick={() => router.push('/watchlist')}>
              View Watchlist
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
