// src/lib/utils/debugUtils.ts

/**
 * Utility function to log GraphQL errors in a more readable format
 * with special handling for CSRF protection errors.
 */
export function logGraphQLError(error: any, operationName: string = 'unknown') {
  if (!error) return;
  
  const networkError = error.networkError;
  const graphQLErrors = error.graphQLErrors;
  
  console.group(`🔍 GraphQL Error in operation: ${operationName}`);
  
  // Check for CSRF protection errors specifically
  const hasCsrfError = graphQLErrors?.some(err => 
    err.message?.includes('CSRF') || 
    err.message?.includes('Cross-Site Request Forgery')
  );
  
  if (hasCsrfError) {
    console.error('🛑 CSRF PROTECTION ERROR DETECTED');
    console.error('This request was blocked by Apollo Server\'s CSRF protection.');
    console.error('Required headers:');
    console.error('- content-type: application/json');
    console.error('- apollo-require-preflight: true');
    console.error('- x-apollo-operation-name: [operation name]');
    
    // Log the headers that were sent
    const requestHeaders = error.networkError?.request?._headers || {};
    console.log('📨 Request headers:', requestHeaders);
  }
  
  // Log GraphQL errors
  if (graphQLErrors && graphQLErrors.length > 0) {
    console.log('GraphQL Errors:');
    graphQLErrors.forEach((err: any, i: number) => {
      console.log(`Error ${i + 1}:`, {
        message: err.message,
        path: err.path,
        code: err.extensions?.code,
        ...(err.extensions?.stacktrace ? { stacktrace: err.extensions.stacktrace } : {})
      });
    });
  }
  
  // Log network errors
  if (networkError) {
    console.log('Network Error:', networkError);
    if (networkError.statusCode) {
      console.log(`Status Code: ${networkError.statusCode}`);
    }
    if (networkError.bodyText) {
      try {
        const parsedError = JSON.parse(networkError.bodyText);
        console.log('Response Body:', parsedError);
      } catch (e) {
        console.log('Response Body (text):', networkError.bodyText);
      }
    }
  }
  
  console.groupEnd();
}

/**
 * Utility to check if an error is a CSRF protection error
 */
export function isCsrfProtectionError(error: any): boolean {
  if (!error) return false;
  
  // Check in graphQLErrors
  if (error.graphQLErrors?.length > 0) {
    return error.graphQLErrors.some((err: any) => 
      err.message?.includes('CSRF') || 
      err.message?.includes('Cross-Site Request Forgery')
    );
  }
  
  // Check in networkError
  if (error.networkError?.bodyText) {
    return error.networkError.bodyText.includes('CSRF') || 
           error.networkError.bodyText.includes('Cross-Site Request Forgery');
  }
  
  // Check the error message itself
  if (error.message) {
    return error.message.includes('CSRF') || 
           error.message.includes('Cross-Site Request Forgery');
  }
  
  return false;
}