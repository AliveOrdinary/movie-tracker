'use client';

import { useState } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WatchHistoryList } from '@/components/watch-history/WatchHistoryList';
import { WatchStats } from '@/components/watch-history/WatchStats';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function WatchHistoryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('history');

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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">My Watch History</h1>
        <Button 
          onClick={() => router.push('/watch-history/add')}
          className="flex items-center gap-2"
        >
          <Plus size={16} />
          Log a Watch
        </Button>
      </div>

      <Tabs defaultValue="history" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Your Watch History</CardTitle>
              <CardDescription>
                A record of all the movies you've watched, when you watched them, and your ratings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WatchHistoryList />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>Watch Statistics</CardTitle>
              <CardDescription>
                Insights and trends from your movie watching habits.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WatchStats />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
