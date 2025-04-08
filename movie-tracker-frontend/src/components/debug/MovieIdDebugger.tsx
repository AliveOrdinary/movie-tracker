'use client';

import React, { useState } from 'react';
import { useMutation, useLazyQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { BULK_ADD_MOVIES, GET_LIST_ITEMS } from '@/types/graphql/lists';

/**
 * This component is a diagnostic tool for debugging movie ID issues
 * It adds a movie ID and then retrieves it to verify whether the ID is preserved
 */
export function MovieIdDebugger() {
  const [movieId, setMovieId] = useState<string>('');
  const [watchlistId, setWatchlistId] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Add debug logs
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const entry = `[${timestamp}] ${message}`;
    console.log(entry);
    setLogs(prev => [entry, ...prev]);
  };

  // Mutation to add movie to watchlist
  const [bulkAddMovies] = useMutation(BULK_ADD_MOVIES, {
    onCompleted: (data) => {
      addLog(`Movie added successfully: ${JSON.stringify(data)}`);
      if (watchlistId) {
        addLog('Now fetching list items to check results...');
        fetchListItems({ variables: { listId: watchlistId } });
      }
    },
    onError: (error) => {
      addLog(`Error adding movie: ${error.message}`);
      setError(error.message);
    }
  });

  // Query to get list items
  const [fetchListItems, { loading }] = useLazyQuery(GET_LIST_ITEMS, {
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      addLog(`List items fetched: ${JSON.stringify(data)}`);
      
      if (data?.listItems && data.listItems.length > 0) {
        // Check if our added movie is in the list
        const items = data.listItems;
        addLog(`Found ${items.length} items in list`);
        
        // Show details for each item
        items.forEach((item, index) => {
          addLog(`Item ${index+1}: movieId=${item.movieId} (type: ${typeof item.movieId})`);
          
          // Check if the ID matches the one we added
          if (movieId && item.movieId && String(item.movieId) === String(movieId)) {
            addLog(`✅ MATCH FOUND: Item ${index+1} matches test ID ${movieId}`);
          }
          
          // If it's a number, check binary representation to look for corruption
          if (typeof item.movieId === 'number') {
            const binaryRep = item.movieId.toString(2);
            addLog(`Binary representation: ${binaryRep} (${binaryRep.length} bits)`);
            
            // Check for 32-bit integer issues
            if (item.movieId > 2147483647 || item.movieId < -2147483648) {
              addLog(`⚠️ WARNING: movieId ${item.movieId} is outside 32-bit integer range!`);
            }
          }
        });
      } else {
        addLog('No items found in list');
      }
    },
    onError: (error) => {
      addLog(`Error fetching list items: ${error.message}`);
      setError(error.message);
    }
  });

  const handleAddMovie = async () => {
    if (!movieId || !watchlistId) {
      setError('Please enter both a movie ID and watchlist ID');
      return;
    }

    setError(null);
    const numericMovieId = parseInt(movieId, 10);
    
    if (isNaN(numericMovieId)) {
      setError('Please enter a valid numeric movie ID');
      return;
    }

    // Add debugging logs
    addLog(`Adding movie ID ${numericMovieId} to list ${watchlistId}`);
    addLog(`Movie ID type: ${typeof numericMovieId}`);
    addLog(`Binary representation: ${numericMovieId.toString(2)} (${numericMovieId.toString(2).length} bits)`);
    
    // Check for 32-bit integer issues
    if (numericMovieId > 2147483647 || numericMovieId < -2147483648) {
      addLog(`⚠️ WARNING: ${numericMovieId} is outside 32-bit integer range!`);
    }
    
    try {
      // Log the exact mutation variables
      const variables = {
        input: {
          listId: watchlistId,
          movieIds: [numericMovieId]
        }
      };
      
      addLog(`Mutation variables: ${JSON.stringify(variables)}`);
      
      // Execute the mutation
      await bulkAddMovies({
        variables
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      addLog(`Error in handler: ${errorMessage}`);
      setError(errorMessage);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Movie ID Debugger</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Watchlist ID</label>
              <Input
                value={watchlistId}
                onChange={(e) => setWatchlistId(e.target.value)}
                placeholder="Enter your watchlist ID"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Movie ID to Test</label>
              <Input
                value={movieId}
                onChange={(e) => setMovieId(e.target.value)}
                placeholder="Enter TMDB movie ID"
                type="number"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleAddMovie} 
              disabled={loading || !movieId || !watchlistId}
            >
              Test Add Movie
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                if (watchlistId) {
                  fetchListItems({ variables: { listId: watchlistId } });
                  addLog(`Fetching list items for list ID: ${watchlistId}`);
                } else {
                  setError('Please enter a watchlist ID');
                }
              }}
              disabled={loading || !watchlistId}
            >
              Fetch List Items
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setLogs([])}
            >
              Clear Logs
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Debug Logs</h3>
            <div className="bg-slate-100 dark:bg-slate-900 p-3 rounded-md text-xs font-mono h-64 overflow-auto">
              {logs.map((log, index) => (
                <div key={index} className={index === 0 ? 'font-bold' : ''}>{log}</div>
              ))}
              {logs.length === 0 && (
                <div className="text-muted-foreground">No logs yet...</div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
