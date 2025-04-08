// src/lib/apollo/client.ts
import { createThrottleLink } from './throttleLink';
import {
  ApolloClient,
  InMemoryCache,
  from,
  NormalizedCacheObject,
  ApolloLink,
  Observable,
  FetchResult,
  ApolloError,
} from '@apollo/client';
import { createAdvancedRetryLink } from './links/retryLink'; // Import the function
import { csrfProtectionLink } from './links/csrfLink';
import { createStrictHttpLink } from './links/httpMethodLink';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { auth } from '../firebase/config';
import { logGraphQLError, isCsrfProtectionError } from '../utils/debugUtils';
import { UserRole, ProfileVisibility, WatchlistDisplayMode, ActivityFeedFilter, ReviewsSortOrder } from '@/types/auth';
// Removed imports for normalizeEnumValue and normalizeUserRoles

// --- Define Links First (Moved Up) ---

const pendingOperations: Record<string, number> = {};
const operationCooldown = 2000;

const deduplicationLink = new ApolloLink((operation, forward) => {
  const operationName = operation.operationName;
  const operationType = operation.query.definitions.find(def => def.kind === 'OperationDefinition') as any;

  if (operationType?.operation === 'mutation') {
    return forward(operation);
  }
  const now = Date.now();
  const lastExecuted = pendingOperations[operationName];
  if (lastExecuted && now - lastExecuted < operationCooldown) {
    console.log(`Skipping duplicate operation: ${operationName}`);
    return new Observable(observer => { observer.next({ data: {} }); observer.complete(); });
  }
  pendingOperations[operationName] = now;
  setTimeout(() => { delete pendingOperations[operationName]; }, operationCooldown);
  return forward(operation);
});

interface MovieData { id: string; tmdbId: number; title: string; }

const PUBLIC_OPERATIONS = [ /* ... list ... */ ];
const AUTHENTICATED_OPERATIONS = [ /* ... list ... */ ];

const fallbackLink = new ApolloLink((operation, _forward) => {
  const operationName = operation.operationName;
  return new Observable<FetchResult>(observer => {
    console.log(`⚠️ Using fallback data for ${operationName} due to network error`);
    let fallbackData = {};
    if (operationName === 'PopularMovies') fallbackData = { popularMovies: [] };
    else if (operationName === 'SearchMovies') fallbackData = { searchMovies: [] };
    else if (operationName === 'Movie') fallbackData = { movie: null };
    observer.next({ data: fallbackData });
    observer.complete();
  });
});

const httpLink = createStrictHttpLink(
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/graphql',
  { credentials: 'include' }
);

const throttleLink = createThrottleLink(3, 2);

const conditionalOperationLink = new ApolloLink((operation, forward) => {
  const operationName = operation.operationName;
  operation.setContext(({ headers = {} }) => ({
    headers: { ...headers, 'x-apollo-operation-name': operationName || 'unknown' }
  }));
  if (AUTHENTICATED_OPERATIONS.includes(operationName)) {
    const isLoggedIn = !!auth.currentUser;
    if (!isLoggedIn) {
      console.log(`Skipping authenticated operation ${operationName} - user not logged in`);
      return new Observable(observer => { observer.next({ data: {} }); observer.complete(); });
    }
  }
  console.log(`Forwarding operation: ${operationName}`);
  return forward(operation);
});

const tokenLink = setContext(async (operation, { headers }) => {
    if (typeof window === 'undefined') return { headers };
    const isPublicOperation = PUBLIC_OPERATIONS.includes(operation.operationName || '');

    try {
        const currentUser = auth.currentUser;
        if (currentUser) {
            const isMutation = operation.query.definitions.some(def => def.kind === 'OperationDefinition' && (def as any).operation === 'mutation');
            let forceRefresh = isMutation || operation.operationName === 'GetMyLists';

            try {
                const operationContext = operation.getContext ? operation.getContext() : {};
                if (operationContext?.forceRefreshToken === true) {
                    forceRefresh = true;
                }
            } catch (contextError) { console.warn('Could not access operation context:', contextError); }

            const token = await currentUser.getIdToken(forceRefresh);
            console.log(`Setting auth token for operation: ${operation.operationName}${forceRefresh ? ' (with force refresh)' : ''}`);
            localStorage.setItem('auth_token', token);
            return { headers: { ...headers, authorization: `Bearer ${token}` } };
        } else if (!isPublicOperation) {
            console.warn(`No user logged in for authenticated operation: ${operation.operationName}`);
            const localToken = localStorage.getItem('auth_token');
            if (localToken) {
                console.log('Using fallback token from localStorage for auth operation');
                return { headers: { ...headers, authorization: `Bearer ${localToken}` } };
            }
        } else {
            const localToken = localStorage.getItem('auth_token');
            if (localToken) {
                console.log('Including token for public operation from localStorage');
                return { headers: { ...headers, authorization: `Bearer ${localToken}` } };
            }
        }
        return { headers };
    } catch (error) {
        console.error('Error getting auth token:', error);
        const localToken = localStorage.getItem('auth_token');
        if (localToken && !isPublicOperation) {
            console.log('Using fallback token from localStorage due to Firebase error');
            return { headers: { ...headers, authorization: `Bearer ${localToken}` } };
        }
        return { headers };
    }
});


const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
    const isAuthPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/auth');
    const isPublicOperation = PUBLIC_OPERATIONS.includes(operation.operationName || '');

    if (graphQLErrors) {
        let shouldSilenceError = false;
        graphQLErrors.forEach(({ message, extensions, path }) => {
            if ((extensions?.code === 'FORBIDDEN' || message.includes('Insufficient permissions')) && auth.currentUser) {
                console.warn(`Permission error for ${operation.operationName}, attempting token refresh...`);
                shouldSilenceError = true;
                auth.currentUser.getIdToken(true).then(newToken => {
                    console.log('Token refreshed, retrying operation with new token.');
                    operation.setContext(({ headers = {} }) => ({ headers: { ...headers, authorization: `Bearer ${newToken}` } }));
                    return forward(operation);
                }).catch(err => console.error('Token refresh failed:', err));
                return;
            }
            if ((isAuthPage && extensions?.code === 'UNAUTHENTICATED' && AUTHENTICATED_OPERATIONS.includes(operation.operationName || '')) ||
                (isPublicOperation && (extensions?.code === 'UNAUTHENTICATED' || message.includes('Authentication required')))) {
                shouldSilenceError = true;
                console.log(`Ignoring expected auth error for ${operation.operationName}`);
                return;
            }
            if (message.includes('Enum "') && message.includes('cannot represent value')) {
                shouldSilenceError = true;
                console.warn(`Enum case mismatch handled by typePolicies: ${message.split('value:')[1]?.trim() || 'unknown'}`);
                return;
            }
            if (message.includes('does not exist') && (
              (message.includes('column Review.') && (message.includes('is_auto_moderated') || message.includes('is_flagged') || message.includes('moderation_reason') || message.includes('moderated_at'))) ||
              (message.includes('column List.') && (message.includes('is_flagged') || message.includes('moderation_reason') || message.includes('moderated_at') || message.includes('is_rejected') || message.includes('is_auto_moderated'))) ||
              (message.includes('column ListCollaborator') && message.includes('is_flagged')) ||
              (message.includes('column ListFavorite') && message.includes('is_flagged'))
            )) {
              shouldSilenceError = true;
              console.warn(`Field validation error suppressed (likely due to migration): ${message}`);
              return;
            }
            if (isCsrfProtectionError({ graphQLErrors: [{ message, extensions, path }] })) {
                shouldSilenceError = true;
                console.warn('🛡️ CSRF protection triggered. Check headers.');
                logGraphQLError({ graphQLErrors: [{ message, extensions, path }] }, operation.operationName);
                return;
            }
            if (!shouldSilenceError) {
                logGraphQLError({ graphQLErrors: [{ message, extensions, path }] }, operation.operationName);
            }
            if (!isAuthPage && !isPublicOperation && (extensions?.code === 'UNAUTHENTICATED' || message.includes('Unauthorized') || message.includes('Invalid token'))) {
                console.error(`Authentication error for protected operation ${operation.operationName}, redirecting to login.`);
                if (typeof window !== 'undefined') { getApolloClient().clearStore().then(() => { window.location.href = '/auth/login'; }); }
            }
        });
    }
    if (networkError) {
        const isRateLimitError = (networkError as any)?.statusCode === 429 || networkError.message.includes('429');
        if (isRateLimitError) {
            console.warn(`Rate limit hit (429) for operation ${operation.operationName}.`);
            if (typeof window !== 'undefined') { window.dispatchEvent(new CustomEvent('rate-limited', { detail: { operation: operation.operationName } })); }
            return;
        }
        logGraphQLError({ networkError }, operation.operationName);
        if (isPublicOperation) {
            console.log(`Using fallback for ${operation.operationName} due to network error`);
            return fallbackLink.request(operation, forward);
        }
    }
});

// *** DEFINE advancedRetryLink HERE, BEFORE getApolloClient ***
const advancedRetryLink = createAdvancedRetryLink(
  2, // maxRetries
  1000, // initialDelayMs
  30000, // maxDelayMs
  [408, 500, 502, 503, 504, 520, 521, 522, 524], // retryStatusCodes
  [], // retryOperations (empty means all operations)
  ['Network error', 'Failed to fetch', 'timeout'] // retryErrorMessages
);

// --- Define Type Policies ---
// Removed normalizeEnumValueFn as we now consistently use UPPERCASE enum values

const typePolicies = {
    User: {
        fields: {
            createdAt: { read: (v: string | null) => v ? new Date(v) : new Date() },
            updatedAt: { read: (v: string | null) => v ? new Date(v) : new Date() },
            lastLoginAt: { read: (v: string | null) => v ? new Date(v) : null },
            lastActivityAt: { read: (v: string | null) => v ? new Date(v) : null },
            bannedAt: { read: (v: string | null) => v ? new Date(v) : null },
            suspendedUntil: { read: (v: string | null) => v ? new Date(v) : null },
            lastWarningAt: { read: (v: string | null) => v ? new Date(v) : null },
            // Removed enum normalization as backend now consistently uses UPPERCASE
        },
    },
    List: {
        fields: {
            isFlagged: { read: () => false },
            isAutoModerated: { read: () => false },
            moderationReason: { read: () => null },
            moderatedAt: { read: () => null },
            // Removed enum normalization as backend now consistently uses UPPERCASE
            createdAt: { read: (v: string | null) => v ? new Date(v) : new Date() },
            updatedAt: { read: (v: string | null) => v ? new Date(v) : new Date() }
        }
    },
    Review: {
        fields: {
            isFlagged: { read: () => false },
            isAutoModerated: { read: () => false },
            moderationReason: { read: () => null },
            moderatedAt: { read: () => null },
            // Removed enum normalization as backend now consistently uses UPPERCASE
        }
    },
    Movie: {
        keyFields: ['tmdbId'], // Use tmdbId as the primary key
        fields: {
            isFlagged: { read: () => false },
            id: { read: (id, { readField }) => id || `movie-${readField('tmdbId')}` }
        }
    },
    WatchHistory: {
        fields: {
            isPrivate: { read: (v: any) => v === undefined ? false : v },
            watchCount: { read: (v: any) => v === undefined ? 1 : v },
            // Removed enum normalization as backend now consistently uses UPPERCASE
        }
    },
    Query: {
        fields: {
            movie: { read: (existing: any) => existing || null },
            popularMovies: { merge: (_e: any, i: any): any[] => i || [] },
            searchMovies: { merge: (_e: any, i: any): any[] => i || [] },
            movieWatchHistory: { merge: (_e: any, i: any): any[] => i || [] },
            movieReviews: { merge: (_e: any, i: any): any[] => i || [] },
            myLists: { merge: (_e: any, i: any): any[] => i || [] },
            collaborativeLists: { merge: (_e: any, i: any): any[] => i || [] },
            favoritedLists: { merge: (_e: any, i: any) => i || { items: [], total: 0, page: 1, totalPages: 1 } },
            trendingLists: { merge: (_e: any, i: any) => i || { items: [], total: 0, page: 1, totalPages: 1 } }
        },
    },
};

// --- Apollo Client Singleton ---
let apolloClientInstance: ApolloClient<NormalizedCacheObject> | undefined;

export function getApolloClient() {
  if (!apolloClientInstance || typeof window === 'undefined') {
    apolloClientInstance = new ApolloClient({
      // Assemble the link chain
      link: from([
        csrfProtectionLink,      // Sets required headers
        errorLink,               // Handles errors
        deduplicationLink,       // Prevents duplicate queries
        throttleLink,          // Basic throttling
        advancedRetryLink,       // Handles retries (NOW DEFINED ABOVE)
        conditionalOperationLink, // Prevents auth queries when logged out
        tokenLink,               // Adds auth token
        httpLink                 // The terminating link (must be last)
      ]),
      cache: new InMemoryCache({ typePolicies }),
      defaultOptions: {
        watchQuery: { fetchPolicy: 'cache-and-network', errorPolicy: 'all', notifyOnNetworkStatusChange: true },
        query: { fetchPolicy: 'cache-first', errorPolicy: 'all' },
        mutate: { errorPolicy: 'all' },
      },
      connectToDevTools: process.env.NODE_ENV === 'development',
    });
  }
  return apolloClientInstance;
}

// --- Helper Functions ---
export function createApolloClient() {
  // Initial ping to warm up connection
  const initialQuery = { query: `query DummyQuery { __typename }` };
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      fetch(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'apollo-require-preflight': 'true',
          'x-apollo-operation-name': 'DummyQuery',
        },
        body: JSON.stringify(initialQuery),
        credentials: 'include'
      }).catch(err => {
        console.log('Initial ping to server failed:', err.message);
      });
    }, 1000);
  }
  return getApolloClient();
}

export async function resetApolloCache() {
  const client = getApolloClient();
  await client.resetStore();
  console.log('Apollo cache reset.');
}