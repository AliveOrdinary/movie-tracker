'use client';

import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useQuery } from '@apollo/client';
import { GET_WATCH_STATS } from '@/components/watch-history';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

// Watch History Stats component
function WatchHistoryStats() {
  const { loading, error, data } = useQuery(GET_WATCH_STATS, {
    fetchPolicy: 'cache-and-network',
  });

  if (loading && !data) {
    return (
      <Card className="md:col-span-3">
        <CardHeader>
          <div className="animate-pulse h-6 w-48 bg-muted rounded"></div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse flex flex-col gap-2">
                <div className="h-8 w-16 bg-muted rounded"></div>
                <div className="h-4 w-20 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="md:col-span-3">
        <CardHeader>
          <CardTitle>Watch History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Error loading watch statistics.</p>
        </CardContent>
        <CardFooter>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.location.href = '/watch-history'}
          >
            View Watch History
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const stats = data?.watchStats;

  if (!stats || stats.totalWatch === 0) {
    return (
      <Card className="md:col-span-3">
        <CardHeader>
          <CardTitle>Watch History</CardTitle>
          <CardDescription>
            Start tracking your movie watches to see your statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center py-4 text-muted-foreground">
            You haven't tracked any movie watches yet.
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={() => window.location.href = '/watch-history/add'}>
            Log Your First Watch
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="md:col-span-3">
      <CardHeader>
        <CardTitle>Watch History</CardTitle>
        <CardDescription>
          Your movie watching statistics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-muted/20 p-4 rounded-lg">
            <p className="text-2xl font-bold">{stats.totalWatch}</p>
            <p className="text-sm text-muted-foreground">Movies Watched</p>
          </div>
          
          <div className="bg-muted/20 p-4 rounded-lg">
            <p className="text-2xl font-bold">{stats.uniqueMovies}</p>
            <p className="text-sm text-muted-foreground">Unique Movies</p>
          </div>
          
          <div className="bg-muted/20 p-4 rounded-lg">
            <p className="text-2xl font-bold">{stats.averageRating?.toFixed(1) || 'N/A'}</p>
            <p className="text-sm text-muted-foreground">Avg. Rating</p>
          </div>
          
          <div className="bg-muted/20 p-4 rounded-lg">
            <p className="text-2xl font-bold">
              {stats.totalWatchTime ? `${Math.floor(stats.totalWatchTime / 60)}h` : 'N/A'}
            </p>
            <p className="text-sm text-muted-foreground">Watch Time</p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          onClick={() => window.location.href = '/watch-history'}
        >
          View Full Stats
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function ProfilePage() {
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
      <h1 className="text-3xl font-bold mb-8">My Profile</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Watch History Stats Summary */}
        <WatchHistoryStats />
        
        <Card>
          <CardHeader>
            <div className="flex flex-col items-center">
              <Avatar className="h-20 w-20 mb-4">
                <AvatarImage src={user.avatarUrl || ''} alt={user.username} />
                <AvatarFallback className="text-xl">
                  {user.username?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <CardTitle>{user.username}</CardTitle>
              <CardDescription>
                {user.email}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Joined:</span>
                <span>{new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email verified:</span>
                <span>{user.emailVerified ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Account type:</span>
                <span>{user.roles.includes('ADMIN') ? 'Administrator' : 
                       user.roles.includes('MODERATOR') ? 'Moderator' : 'User'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last login:</span>
                <span>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => router.push('/settings')}>
              Edit Profile
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Account Overview</CardTitle>
            <CardDescription>
              Your activity and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-2">Privacy Settings</h3>
                <div className="flex justify-between text-sm mb-1">
                  <span>Profile visibility:</span>
                  <span className="font-medium">{user.profileVisibility}</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Show online status:</span>
                  <span className="font-medium">{user.showOnlineStatus ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Show activity:</span>
                  <span className="font-medium">{user.showActivity ? 'Yes' : 'No'}</span>
                </div>
              </div>
              
              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-2">Preferences</h3>
                <div className="flex justify-between text-sm mb-1">
                  <span>Watchlist display:</span>
                  <span className="font-medium">{user.watchlistDisplayMode}</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Activity feed filter:</span>
                  <span className="font-medium">{user.activityFeedFilter}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Reviews sort order:</span>
                  <span className="font-medium">{user.reviewsSortOrder}</span>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => router.push('/lists')}>
              My Lists
            </Button>
            <Button variant="outline" onClick={() => router.push('/watch-history')}>
              Watch History
            </Button>
            <Button onClick={() => router.push('/settings')}>
              Settings
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
