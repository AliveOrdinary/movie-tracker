'use client';

import React from 'react';
import { MovieIdDebugger } from '@/components/debug/MovieIdDebugger';

export default function DebugPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Debug Tools</h1>
      <div className="grid gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Movie ID Debugger</h2>
          <p className="text-muted-foreground mb-4">
            This tool helps diagnose issues with movie IDs being corrupted between the frontend and backend.
            Enter your watchlist ID and a movie ID to test whether the ID is preserved properly.
          </p>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-md mb-6">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              <strong>Note:</strong> The watchlist ID can be found in the URL when viewing your watchlist,
              or from the browser developer tools network tab when making requests. 
              It looks like: <code>384fc0dd-1110-47bf-b711-1ffb4e0e7512</code>
            </p>
          </div>
          <MovieIdDebugger />
        </div>
      </div>
    </div>
  );
}
