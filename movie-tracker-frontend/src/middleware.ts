// src/middleware.ts (Simplified)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Only potentially modify GraphQL requests
  if (request.nextUrl.pathname.includes('graphql')) {
    // Skip OPTIONS requests
    if (request.method === 'OPTIONS') {
      return NextResponse.next();
    }

    // Ensure standard headers expected by Apollo Server CSRF protection are present
    const requestHeaders = new Headers(request.headers);
    if (!requestHeaders.has('Content-Type')) {
      requestHeaders.set('Content-Type', 'application/json');
    }
    // Ensure apollo-require-preflight is set for non-GET requests
    if (request.method !== 'GET') {
       requestHeaders.set('apollo-require-preflight', 'true');
    }
    // Ensure operation name header is present for logging/debugging
    if (!requestHeaders.has('x-apollo-operation-name')) {
      requestHeaders.set('x-apollo-operation-name', 'unknown-op'); // Provide a default
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // For all other routes, continue without modification
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/:path*/graphql', '/graphql'],
};