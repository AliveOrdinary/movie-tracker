// src/components/auth/AuthGuard.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      console.log('AuthGuard: User is authenticated, redirecting to home');
      router.push('/');
    } else {
      console.log('AuthGuard: Not authenticated or still loading', { loading, isAuthenticated: !!user });
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // User is authenticated, don't render children (login/signup forms)
  if (!loading && user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p>Already authenticated. Redirecting...</p>
        </div>
      </div>
    );
  }

  // User is not authenticated, render the children (login/signup forms)
  return <>{children}</>;
}