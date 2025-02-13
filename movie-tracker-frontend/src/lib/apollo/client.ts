// src/lib/apollo/client.ts
'use client';

import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  from,
  NormalizedCacheObject,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { auth } from '../firebase/config';

const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/graphql',
});

const authLink = setContext(async (_, { headers }) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    return {
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : '',
      },
    };
  } catch (error) {
    console.error('Error getting auth token:', error);
    return { headers };
  }
});

const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      );

      // Handle authentication errors
      if (message.includes('Unauthorized') || message.includes('Invalid token')) {
        // Only redirect if we're not already on an auth page and it's not an unprotected operation
        const unprotectedOperations = ['GetPopularMovies', 'SearchMovies'];
        if (
          typeof window !== 'undefined' &&
          !window.location.pathname.startsWith('/auth') &&
          !unprotectedOperations.includes(operation.operationName || '')
        ) {
          window.location.href = '/auth/login';
        }
      }
    });
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
  }
});

// Cache configuration
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        popularMovies: {
          merge(existing = [], incoming) {
            return [...existing, ...incoming];
          },
        },
        searchMovies: {
          merge(existing = [], incoming) {
            return [...existing, ...incoming];
          },
        },
      },
    },
  },
});

let apolloClient: ApolloClient<NormalizedCacheObject> | undefined;

export function getApolloClient() {
  if (!apolloClient || typeof window === 'undefined') {
    apolloClient = new ApolloClient({
      link: from([errorLink, authLink, httpLink]),
      cache,
      defaultOptions: {
        watchQuery: {
          fetchPolicy: 'cache-and-network',
          errorPolicy: 'all',
        },
        query: {
          fetchPolicy: 'network-only',
          errorPolicy: 'all',
        },
        mutate: {
          errorPolicy: 'all',
        },
      },
      connectToDevTools: process.env.NODE_ENV === 'development',
    });
  }
  return apolloClient;
}

export function createApolloClient() {
  return getApolloClient();
}

// Optional: Reset store (useful for logout)
export async function resetApolloCache() {
  const client = getApolloClient();
  await client.resetStore();
}