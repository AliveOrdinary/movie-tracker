// src/lib/utils/fetchUtils.ts

// Global rate limiting state
// Use a Map of endpoint -> timestamps for fine-grained control
const requestTimestamps: Map<string, number[]> = new Map();
const MAX_REQUESTS_PER_WINDOW = 5; // Maximum requests per time window
const TIME_WINDOW_MS = 5000; // Time window in milliseconds (5 seconds)
const COOLDOWN_PERIOD_MS = 10000; // Cooldown period after hitting rate limit (10 seconds)
const MIN_REQUEST_INTERVAL_MS = 500; // Minimum time between identical requests (0.5 seconds)

// Track rate limited endpoints to apply longer cooldowns
let rateLimitedUntil: Map<string, number> = new Map();

/**
 * Force POST method for all requests to specified endpoints
 * This is a utility to ensure GraphQL requests always use POST
 * and include proper CSRF protection headers.
 */
export function setupGlobalFetchInterceptor() {
  if (typeof window === 'undefined') return;
  
  // Store original fetch
  const originalFetch = window.fetch;
  
  // Override fetch with our custom implementation
  window.fetch = async function(input, init) {
    // Convert input to URL if it's a string
    const url = typeof input === 'string' 
      ? new URL(input, window.location.origin) 
      : new URL(input instanceof Request ? input.url : input.toString(), window.location.origin);
    
    // Enhanced rate limiting for GraphQL
    if (url.pathname.includes('/graphql')) {
      const endpoint = url.pathname;
      
      // Extract operation name if present in body
      let operationName = 'unknown';
      let operationKey = `${endpoint}:${operationName}`;
      let requestBody = '';
      
      try {
        if (init?.body) {
          // For string body, try to parse as JSON
          if (typeof init.body === 'string') {
            requestBody = init.body;
            const bodyData = JSON.parse(init.body);
            if (bodyData.operationName) {
              operationName = bodyData.operationName;
              operationKey = `${endpoint}:${operationName}`;
            }
          }
          // For URLSearchParams or FormData, try to extract from URL
          else if (init.body instanceof URLSearchParams || init.body instanceof FormData) {
            operationName = init.body.get('operationName') || 'unknown';
            operationKey = `${endpoint}:${operationName}`;
          }
        }
      } catch (e) {
        console.warn('Failed to extract operation name from GraphQL request body');
      }
      
      // Check if this endpoint is under cooldown (previously rate-limited)
      const cooldownExpiry = rateLimitedUntil.get(operationKey);
      if (cooldownExpiry && Date.now() < cooldownExpiry) {
        console.warn(`Request to ${operationKey} is in cooldown period. Skipping request.`);
        // Return an empty response
        return new Response(JSON.stringify({ data: {} }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Rate limiting per operation
      if (!requestTimestamps.has(operationKey)) {
        requestTimestamps.set(operationKey, []);
      }
      
      const timestamps = requestTimestamps.get(operationKey)!;
      const now = Date.now();
      
      // Remove timestamps outside the time window
      const recentTimestamps = timestamps.filter(ts => now - ts < TIME_WINDOW_MS);
      requestTimestamps.set(operationKey, recentTimestamps);
      
      // Check if we've made an identical request very recently (prevent duplicates)
      if (requestBody) {
        const lastTimestamp = recentTimestamps[recentTimestamps.length - 1];
        if (lastTimestamp && now - lastTimestamp < MIN_REQUEST_INTERVAL_MS) {
          console.info(`Dropping duplicate request to ${operationKey} (too frequent)`);
          // Return an empty response for duplicate requests
          return new Response(JSON.stringify({ data: {} }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
      
      // Check if we've exceeded rate limit
      if (recentTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
        console.warn(`Rate limit exceeded for ${operationKey}. Applying cooldown.`);
        // Set cooldown period for this endpoint
        rateLimitedUntil.set(operationKey, now + COOLDOWN_PERIOD_MS);
        // Return a rate limit response
        return new Response(JSON.stringify({
          errors: [{
            message: `Rate limit exceeded for ${operationName}. Please try again later.`
          }]
        }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Add current timestamp
      recentTimestamps.push(now);
      requestTimestamps.set(operationKey, recentTimestamps);
      
      // Force POST method for GraphQL
      const newInit = {
        ...init,
        method: 'POST',
        headers: {
          ...(init?.headers || {}),
          'content-type': 'application/json',
          'apollo-require-preflight': 'true',
          'x-apollo-operation-name': operationName,
        }
      };
      
      // If this was originally GET or another method, log it
      if (init?.method && init.method !== 'POST') {
        console.info(`Intercepted ${init.method} request to GraphQL and converted to POST (operation: ${operationName})`);
      }
      
      // Call original fetch with modified options
      return originalFetch(input, newInit).then(
        response => {
          // Check if response is rate limited
          if (response.status === 429) {
            console.warn(`Server rate-limited request to ${operationKey}. Applying cooldown.`);
            // Set cooldown period for this endpoint
            rateLimitedUntil.set(operationKey, now + COOLDOWN_PERIOD_MS);
            // Update UI to indicate we're rate-limited
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('rate-limited', {
                detail: { operation: operationName }
              }));
            }
          }
          return response;
        }
      );
    }
    
    // If not GraphQL, use original fetch
    return originalFetch(input, init);
  };
  
  console.log('Global fetch interceptor set up for GraphQL endpoints with rate limiting and CSRF protection');
}

/**
 * Retry a failed request
 * @param fetcher Function that performs the fetch request
 * @param options Retry options
 * @returns Fetch response
 */
export async function retryFetch<T>(
  fetcher: () => Promise<T>,
  { maxRetries = 3, backoff = true, backoffFactor = 2, initialDelay = 300 }: {
    maxRetries?: number;
    backoff?: boolean;
    backoffFactor?: number;
    initialDelay?: number;
  } = {}
): Promise<T> {
  let retries = 0;
  let lastError: any;
  
  // Try until we succeed or run out of retries
  while (retries <= maxRetries) {
    try {
      return await fetcher();
    } catch (error) {
      // Don't retry rate limited requests
      if (error instanceof Response && error.status === 429) {
        console.warn('Rate limit error, not retrying');
        throw error;
      }
      
      lastError = error;
      retries++;
      
      // If we've used all retries, throw the last error
      if (retries > maxRetries) {
        throw lastError;
      }
      
      // If backoff enabled, calculate delay
      const delay = backoff 
        ? initialDelay * Math.pow(backoffFactor, retries - 1) 
        : initialDelay;
      
      console.warn(`Request failed, retrying (${retries}/${maxRetries}) in ${delay}ms...`, error);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // This should never be reached because of the throw above,
  // but TypeScript doesn't know that
  throw lastError;
}

/**
 * Check if an API is available by making a HEAD request
 * @param url API URL to check
 * @returns True if API is available
 */
export async function isApiAvailable(url?: string): Promise<boolean> {
  try {
    // Use the original fetch to avoid our own interceptor
    // This prevents an infinite loop of intercepted requests
    const apiUrl = url || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/graphql';
    
    // For GraphQL endpoints, use a lightweight introspection query instead of a HEAD request
    if (apiUrl.includes('/graphql')) {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apollo-require-preflight': 'true',
          'x-apollo-operation-name': 'IntrospectionQuery'
        },
        body: JSON.stringify({
          query: '{ __typename }',
          operationName: 'IntrospectionQuery'
        }),
        // Add a cache-busting timestamp to prevent caching
        cache: 'no-store',
      });
      return response.ok;
    }
    
    // For non-GraphQL endpoints, use a regular HEAD request
    const response = await fetch(apiUrl, {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-store',
    });
    
    return true;
  } catch (error) {
    console.warn('API availability check failed:', error);
    return false;
  }
}

/**
 * Add CSRF protection headers to Apollo requests
 * @param operationName GraphQL operation name
 * @returns Headers object
 */
export function getCsrfProtectionHeaders(operationName: string = 'unknown'): Record<string, string> {
  return {
    'content-type': 'application/json',
    'apollo-require-preflight': 'true',
    'x-apollo-operation-name': operationName,
  };
}

/**
 * Clear rate limiting data
 * This can be used when the user manually refreshes or logs out
 */
export function clearRateLimiting() {
  requestTimestamps.clear();
  rateLimitedUntil.clear();
}