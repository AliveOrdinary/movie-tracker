// src/components/movies/WatchProviders.tsx
'use client';

import Image from 'next/image';
import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface WatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

interface WatchProvidersProps {
  providers: {
    flatrate?: WatchProvider[];
    rent?: WatchProvider[];
    buy?: WatchProvider[];
  } | {
    results: {
      [countryCode: string]: {
        link: string;
        flatrate?: WatchProvider[];
        rent?: WatchProvider[];
        buy?: WatchProvider[];
      }
    }
  };
  link?: string;
}

export function WatchProviders({ providers, link: propLink }: WatchProvidersProps) {
  // Handle different props structures
  let flatrate: WatchProvider[] | undefined;
  let rent: WatchProvider[] | undefined;
  let buy: WatchProvider[] | undefined;
  let link: string;

  // Check if providers is in the direct format or the nested results format
  if ('results' in providers) {
    // We're dealing with the nested structure, defaulting to US
    const region = 'US';
    const countryData = providers.results[region];
    
    if (!countryData) {
      return null; // No data for this region
    }
    
    flatrate = countryData.flatrate;
    rent = countryData.rent;
    buy = countryData.buy;
    link = countryData.link;
  } else {
    // Direct structure
    flatrate = providers.flatrate;
    rent = providers.rent;
    buy = providers.buy;
    link = propLink || '';
  }
  
  // Don't show anything if there are no providers
  const hasProviders = (flatrate?.length || 0) > 0 || (rent?.length || 0) > 0 || (buy?.length || 0) > 0;
  
  if (!hasProviders) return null;

  const ProviderList = ({ providers }: { providers: WatchProvider[] }) => (
    <div className="grid grid-cols-4 gap-4">
      {providers.map((provider) => (
        <div 
          key={provider.provider_id}
          className="flex flex-col items-center text-center gap-2"
        >
          <div className="relative h-12 w-12 rounded-lg overflow-hidden">
            <Image
              src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
              alt={provider.provider_name}
              fill
              className="object-cover"
            />
          </div>
          <span className="text-xs line-clamp-2">{provider.provider_name}</span>
        </div>
      ))}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Where to Watch</CardTitle>
        <CardDescription>Available streaming options</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={flatrate ? "stream" : rent ? "rent" : "buy"} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            {flatrate && <TabsTrigger value="stream">Stream</TabsTrigger>}
            {rent && <TabsTrigger value="rent">Rent</TabsTrigger>}
            {buy && <TabsTrigger value="buy">Buy</TabsTrigger>}
          </TabsList>
          {flatrate && (
            <TabsContent value="stream">
              <ScrollArea className="h-[200px] pr-4">
                <ProviderList providers={flatrate} />
              </ScrollArea>
            </TabsContent>
          )}
          {rent && (
            <TabsContent value="rent">
              <ScrollArea className="h-[200px] pr-4">
                <ProviderList providers={rent} />
              </ScrollArea>
            </TabsContent>
          )}
          {buy && (
            <TabsContent value="buy">
              <ScrollArea className="h-[200px] pr-4">
                <ProviderList providers={buy} />
              </ScrollArea>
            </TabsContent>
          )}
        </Tabs>
        <Button
          variant="outline"
          className="w-full mt-4"
          onClick={() => window.open(link, '_blank')}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          View All Options
        </Button>
      </CardContent>
    </Card>
  );
}