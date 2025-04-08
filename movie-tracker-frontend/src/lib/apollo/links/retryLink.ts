// src/lib/apollo/links/retryLink.ts
import { ApolloLink, Operation, FetchResult, Observable } from '@apollo/client';

type RetryFunction = (operation: Operation, forward: ApolloLink, retries: number) => Observable<FetchResult>;

export const createAdvancedRetryLink = (
  maxRetries: number = 3,
  initialDelayMs: number = 1000, 
  maxDelayMs: number = 30000,
  retryStatusCodes: number[] = [408, 500, 502, 503, 504, 520, 521, 522, 524],
  retryOperations: string[] = [],
  retryErrorMessages: string[] = ['Network error', 'Failed to fetch', 'timeout']
): ApolloLink => {
  // Rate-limited operations cache to implement even longer backoff
  const rateLimitedOperations: Record<string, number> = {};
  
  // Create the retry function
  const retryPredicate = (err: any, operation: Operation): boolean => {
    const opName = operation.operationName || 'unknown';
    
    // Skip operations that don't match our retry list (if specified)
    if (retryOperations.length > 0 && !retryOperations.includes(opName)) {
      console.log(`Not retrying operation ${opName} - not in retry list`);
      return false;
    }
    
    // Don't retry mutations
    const operationType = operation.query.definitions.find(
      def => def.kind === 'OperationDefinition'
    ) as any;
    
    if (operationType && operationType.operation === 'mutation') {
      console.log(`Not retrying mutation ${opName}`);
      return false;
    }
    
    // Check if operation was recently rate limited
    if (rateLimitedOperations[opName]) {
      const timeSinceRateLimit = Date.now() - rateLimitedOperations[opName];
      if (timeSinceRateLimit < 30000) { // 30 seconds backoff for rate-limited operations
        console.log(`Not retrying recently rate-limited operation ${opName} (backoff: ${(30000 - timeSinceRateLimit) / 1000}s remaining)`);
        return false;
      }
      // Clear the rate limit marker after the backoff period
      delete rateLimitedOperations[opName];
    }
    
    // Handle rate limit (status 429) specially
    const isRateLimit = 
      err.statusCode === 429 || 
      (err.networkError && err.networkError.status === 429) ||
      err.message.includes('429') ||
      err.message.includes('Too Many Requests') ||
      err.message.includes('too many requests');
    
    if (isRateLimit) {
      console.log(`Rate limit detected for ${opName} - applying extended backoff`);
      // Mark this operation as rate-limited
      rateLimitedOperations[opName] = Date.now();
      return false;
    }
    
    // Check graphQL errors
    if (err.graphQLErrors && err.graphQLErrors.length > 0) {
      // Check for specific GraphQL error messages
      for (const gqlError of err.graphQLErrors) {
        // Check for any of our retry error messages
        for (const errorText of retryErrorMessages) {
          if (gqlError.message.toLowerCase().includes(errorText.toLowerCase())) {
            console.log(`Retrying operation ${opName} due to GraphQL error: ${gqlError.message}`);
            return true;
          }
        }
      }
      
      // Don't retry GraphQL errors that don't match our criteria
      return false;
    }
    
    // Check for network errors
    if (err.networkError) {
      // Check for status codes that should be retried
      if (err.networkError.statusCode && retryStatusCodes.includes(err.networkError.statusCode)) {
        console.log(`Retrying operation ${opName} due to status code ${err.networkError.statusCode}`);
        return true;
      }
      
      // Check for transient network error messages
      for (const errorText of retryErrorMessages) {
        if (err.networkError.message && err.networkError.message.toLowerCase().includes(errorText.toLowerCase())) {
          console.log(`Retrying operation ${opName} due to network error: ${err.networkError.message}`);
          return true;
        }
      }
    }
    
    // Check the main error message
    for (const errorText of retryErrorMessages) {
      if (err.message && err.message.toLowerCase().includes(errorText.toLowerCase())) {
        console.log(`Retrying operation ${opName} due to error: ${err.message}`);
        return true;
      }
    }
    
    // Default: don't retry
    return false;
  };
  
  const retryAfterFunction = (count: number, operation: Operation, error: any): number => {
    const operationName = operation.operationName || 'unknown';
    
    // Get retry-after header if available
    if (error.networkError && error.networkError.response && error.networkError.response.headers) {
      const retryAfter = error.networkError.response.headers.get('retry-after');
      if (retryAfter && !isNaN(parseInt(retryAfter))) {
        const retryAfterMs = parseInt(retryAfter) * 1000;
        console.log(`Retry-After header found for ${operationName}: ${retryAfterMs}ms`);
        return Math.min(retryAfterMs, maxDelayMs);
      }
    }
    
    // Implement exponential backoff with jitter
    const delay = Math.min(
      initialDelayMs * Math.pow(2, count) * (0.8 + Math.random() * 0.4), // Add 20% jitter
      maxDelayMs
    );
    
    console.log(`Retrying ${operationName} in ${Math.round(delay)}ms (attempt ${count + 1}/${maxRetries})`);
    return delay;
  };
  
  // The actual retry implementation
  const retry: RetryFunction = (operation, forward, retries) => {
    return new Observable(observer => {
      let sub: { unsubscribe: () => void };
      
      const retrySubscription = () => {
        try {
          sub = forward(operation).subscribe({
            next: result => {
              observer.next(result);
              observer.complete();
            },
            error: err => {
              // Check if we should retry
              if (retries < maxRetries && retryPredicate(err, operation)) {
                // Calculate backoff delay
                const delay = retryAfterFunction(retries, operation, err);
                
                // Set a timeout for the retry
                setTimeout(
                  () => {
                    // Try the request again
                    const retryObservable = retry(operation, forward, retries + 1);
                    
                    sub = retryObservable.subscribe({
                      next: result => {
                        observer.next(result);
                        observer.complete();
                      },
                      error: finalError => {
                        observer.error(finalError);
                      },
                      complete: () => {
                        observer.complete();
                      }
                    });
                  },
                  delay
                );
              } else {
                // We've exhausted our retries or determined not to retry
                observer.error(err);
              }
            },
            complete: () => {
              observer.complete();
            },
          });
        } catch (e) {
          observer.error(e);
        }
      };
      
      retrySubscription();
      
      return () => {
        if (sub) {
          sub.unsubscribe();
        }
      };
    });
  };
  
  return new ApolloLink((operation, forward) => {
    return retry(operation, forward, 0);
  });
};
