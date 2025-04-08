'use client';

import { useState, useEffect } from 'react';
import { 
  AlertTriangle,
  WifiOff, 
  RefreshCcw,
  Zap,
  AlertCircle
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { clearRateLimiting } from '@/lib/utils/fetchUtils';

interface ConnectivityCheckerProps {
  pollInterval?: number;
}

export function ConnectivityChecker({ pollInterval = 30000 }: ConnectivityCheckerProps) {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isRateLimited, setIsRateLimited] = useState<boolean>(false);
  const [rateLimitedOperation, setRateLimitedOperation] = useState<string | null>(null);
  const [shouldRefresh, setShouldRefresh] = useState<boolean>(false);
  
  // Function to reset rate limiting state
  const handleReset = () => {
    clearRateLimiting();
    setIsRateLimited(false);
    setRateLimitedOperation(null);
    setShouldRefresh(false);
  };
  
  // Handle user coming back online
  const handleOnline = () => {
    setIsOnline(true);
  };
  
  // Handle user going offline
  const handleOffline = () => {
    setIsOnline(false);
  };
  
  // Check if a refresh is needed after repeated issues
  const checkShouldRefresh = () => {
    if (isRateLimited) {
      setShouldRefresh(true);
    }
  };
  
  // Handle rate limiting events
  const handleRateLimited = (event: Event) => {
    const customEvent = event as CustomEvent;
    setIsRateLimited(true);
    if (customEvent.detail?.operation) {
      setRateLimitedOperation(customEvent.detail.operation);
    }
    
    // After 10 seconds, suggest a refresh
    setTimeout(checkShouldRefresh, 10000);
  };
  
  // Set up event listeners
  useEffect(() => {
    // Set up rate limiting event listener
    window.addEventListener('rate-limited', handleRateLimited);
    
    // Set up online/offline event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Clean up event listeners
    return () => {
      window.removeEventListener('rate-limited', handleRateLimited);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Handle periodic reset of rate limiting state
  useEffect(() => {
    // Reset rate limited state after some time
    const timer = setTimeout(() => {
      if (isRateLimited) {
        setIsRateLimited(false);
        setRateLimitedOperation(null);
      }
    }, 30000); // 30 seconds
    
    return () => clearTimeout(timer);
  }, [isRateLimited]);
  
  if (!isOnline) {
    return (
      <Alert variant="destructive">
        <WifiOff className="h-4 w-4" />
        <AlertTitle>You are offline</AlertTitle>
        <AlertDescription>
          <div className="flex flex-col space-y-2">
            <p>Please check your internet connection.</p>
            <div className="flex justify-end">
              <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
                <RefreshCcw className="h-3 w-3 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  }
  
  if (isRateLimited) {
    return (
      <Alert variant="warning">
        <Zap className="h-4 w-4" />
        <AlertTitle>Rate limit reached</AlertTitle>
        <AlertDescription>
          <div className="flex flex-col space-y-2">
            <p>
              {rateLimitedOperation 
                ? `Too many requests for "${rateLimitedOperation}". Please wait a moment.` 
                : 'Too many requests. Please wait a moment.'}
            </p>
            {shouldRefresh && (
              <div className="flex justify-end">
                <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
                  <RefreshCcw className="h-3 w-3 mr-2" />
                  Refresh Page
                </Button>
              </div>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }
  
  return null;
}