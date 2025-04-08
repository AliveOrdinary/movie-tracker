// src/lib/apollo/links/csrfLink.ts
import { ApolloLink } from '@apollo/client';

/**
 * Apollo Link specifically designed to prevent CSRF protection errors
 * by adding the necessary headers to every GraphQL request.
 * 
 * This link should be placed first in the link chain to ensure
 * that these headers are always set before any other operations.
 */
export const csrfProtectionLink = new ApolloLink((operation, forward) => {
  // Get the operation name for proper header tagging
  const operationName = operation.operationName || 'unknown';
  
  // Always add these headers to prevent CSRF protection
  operation.setContext(({ headers = {} }) => ({
    headers: {
      ...headers,
      // These headers are required by Apollo Server's CSRF protection
      'Content-Type': 'application/json',
      'apollo-require-preflight': 'true',
      'x-apollo-operation-name': operationName,
      // Additional security headers
      'x-content-type-options': 'nosniff',
    },
  }));
  
  return forward(operation);
});