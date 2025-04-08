'use client';

import { useState } from 'react';
import { StandardListWrapper } from '@/components/lists';
import { ListType } from '@/types/graphql/lists';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function WatchlistPage() {
  const [activeTab, setActiveTab] = useState<string>('watchlist');
  
  return (
    <div className="container px-4 py-6">
      <h1 className="text-3xl font-bold mb-6">My Movie Collections</h1>
      
      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertDescription>
          These are your system lists. Movies you add to your watchlist won't appear in your custom lists.
        </AlertDescription>
      </Alert>
      
      <Tabs defaultValue="watchlist" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
          <TabsTrigger value="watched">Watched Movies</TabsTrigger>
        </TabsList>
        
        <TabsContent value="watchlist">
          <StandardListWrapper 
            listName="Watchlist" 
            listType={ListType.STANDARD}
            allowDelete={false}
            allowEdit={false} 
          />
        </TabsContent>
        
        <TabsContent value="watched">
          <StandardListWrapper 
            listName="Watched Movies" 
            listType={ListType.STANDARD}
            allowDelete={false}
            allowEdit={false} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
