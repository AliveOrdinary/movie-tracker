// src/lib/apollo/links/forcePostLink.ts
import { ApolloLink } from '@apollo/client';

/**
 * Force all requests to use POST method regardless of operation type.
 * This resolves the "Apollo Server supports only GET/POST requests" error.
 */
export const forcePostLink = new ApolloLink((operation, forward) => {
  // Force POST method for all operations
  operation.setContext(({ method, ...rest }) => ({
    ...rest,
    method: 'POST', // Always force POST method
    headers: {
      ...rest.headers,
      // Add necessary headers
      'Content-Type': 'application/json',
      'apollo-require-preflight': 'true',
      'x-apollo-operation-name': operation.operationName || 'unnamed',
    },
  }));
  
  // Log the forced method
  if (process.env.NODE_ENV === 'development') {
    console.log(`ForcePostLink: Enforced POST method for operation "${operation.operationName || 'unnamed'}"`);
  }
  
  return forward(operation);
});