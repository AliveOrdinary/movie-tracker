'use client';

// src/components/layout/RootLayoutProvider.tsx
import { usePathname } from 'next/navigation';
import { Header } from '@/components/header';

interface RootLayoutProviderProps {
  children: React.ReactNode;
}

export function RootLayoutProvider({ children }: RootLayoutProviderProps) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith('/auth');

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}