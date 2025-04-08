// src/lib/apollo/throttleLink.ts
import { ApolloLink, Operation, FetchResult, Observable } from '@apollo/client';

interface PendingRequest {
  operation: Operation;
  forward: any;
  observer: any;
  resolve: () => void;
}

/**
 * Creates an Apollo Link that throttles requests to avoid rate limiting
 * by controlling concurrent requests and implementing queuing
 */
export const createThrottleLink = (
  maxConcurrentRequests = 2, // Maximum number of concurrent requests
  requestsPerSecond = 1,     // Maximum requests per second
  timeWindow = 1000,         // Time window in milliseconds
) => {
  let pendingRequests: PendingRequest[] = [];
  let activeRequests = 0;
  let requestCounter = 0;
  let lastRequestTime = 0;

  // Process the next request from the queue
  const processNextRequest = () => {
    if (pendingRequests.length === 0 || activeRequests >= maxConcurrentRequests) {
      return;
    }

    // Calculate time since last request to enforce rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    const minimumWaitTime = timeWindow / requestsPerSecond;

    if (timeSinceLastRequest < minimumWaitTime) {
      // If we need to wait due to rate limiting, schedule the next request
      const timeToWait = minimumWaitTime - timeSinceLastRequest;
      console.log(`Rate limiting in effect: waiting ${timeToWait}ms before next request`);
      setTimeout(processNextRequest, timeToWait);
      return;
    }

    // Get the next request from the queue
    const { operation, forward, observer, resolve } = pendingRequests.shift()!;
    activeRequests++;
    lastRequestTime = now;

    console.log(`Processing request: ${operation.operationName || 'unknown'} (${activeRequests} active, ${pendingRequests.length} pending)`);

    forward(operation).subscribe({
      next: (result: FetchResult) => {
        observer.next(result);
      },
      error: (error: any) => {
        console.warn(`Request error for ${operation.operationName}:`, error.message || 'Unknown error');
        observer.error(error);
      },
      complete: () => {
        observer.complete();
        activeRequests--;
        resolve();
        processNextRequest();
      }
    });
  };

  // Create the Apollo Link
  return new ApolloLink((operation, forward) => {
    return new Observable(observer => {
      return new Promise<void>(resolve => {
        // Add the request to the queue
        pendingRequests.push({ operation, forward, observer, resolve });
        processNextRequest();
      });
    });
  });
};
