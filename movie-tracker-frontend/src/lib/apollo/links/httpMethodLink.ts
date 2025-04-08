// src/lib/apollo/links/httpMethodLink.ts
import { ApolloLink } from '@apollo/client';
import { createHttpLink } from '@apollo/client/link/http';

/**
 * Creates an HTTP link that strictly enforces POST method for GraphQL operations
 * to avoid the "Apollo Server supports only GET/POST requests" error.
 */
export const createStrictHttpLink = (uri: string, additionalOptions = {}) => {
  console.log(`Creating Apollo HTTP link with URI: ${uri}`);
  
  return createHttpLink({
    uri,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'apollo-require-preflight': 'true',
    },
    useGETForQueries: false, // Never use GET for queries
    fetchOptions: {
      method: 'POST', // Always use POST
      mode: 'cors',
      credentials: 'include',
    },
    // Apply any additional options (like headers)
    ...additionalOptions,
  });
};