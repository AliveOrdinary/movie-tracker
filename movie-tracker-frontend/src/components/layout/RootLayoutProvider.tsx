'use client';

// src/components/layout/RootLayoutProvider.tsx
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { Header } from '@/components/header';
import { ConnectivityChecker } from '@/components/ConnectivityChecker';

interface RootLayoutProviderProps {
  children: React.ReactNode;
}

export function RootLayoutProvider({ children }: RootLayoutProviderProps) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith('/auth');
  const { isAuthenticated, loading } = useAuth();
  
  // Debug the layout state
  useEffect(() => {
    console.log('RootLayoutProvider state:', {
      isAuthPage,
      pathname,
      isAuthenticated,
      loading
    });
  }, [isAuthPage, pathname, isAuthenticated, loading]);

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="container mx-auto px-4 mt-2">
        <ConnectivityChecker />
      </div>
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}