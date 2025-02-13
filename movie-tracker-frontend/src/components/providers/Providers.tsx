// src/components/providers/Providers.tsx
'use client';

import { useState, useEffect } from 'react';
import { ApolloProvider } from '@apollo/client';
import { createApolloClient } from '@/lib/apollo/client';
import { AuthProvider } from '@/lib/auth/AuthContext';

export function Providers({ children }: { children: React.ReactNode }) {

  const [mounted, setMounted] = useState(false);
  const [client] = useState(createApolloClient());

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // You can show a loading state here if you want
    return null;
  }

  return (
    <ApolloProvider client={client}>
      <AuthProvider>{children}</AuthProvider>
    </ApolloProvider>
  );
}