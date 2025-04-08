// src/components/providers/Providers.tsx
'use client';

import { useState, useEffect } from 'react';
import { ApolloProvider } from '@apollo/client';
import { createApolloClient } from '@/lib/apollo/client';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { ListsProvider } from '@/lib/lists/ListsContext';
import { ConnectivityChecker } from '@/components/ConnectivityChecker';
import { logEnvStatus } from '@/lib/utils/checkEnv';
import { setupGlobalFetchInterceptor } from '@/lib/utils/fetchUtils';
import { registerGraphQLDefaults } from '@/lib/utils/graphqlDefaults';
import '../../../src/lib/utils/debugAuth'; // Import to make debug utility available

interface ConnectivityContextType {
  isOffline: boolean;
  setIsOffline: (value: boolean) => void;
}

// Create a global connectivity context
import { createContext, useContext } from 'react';

export const ConnectivityContext = createContext<ConnectivityContextType>({
  isOffline: false,
  setIsOffline: () => {},
});

export const useConnectivity = () => useContext(ConnectivityContext);

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [client] = useState(createApolloClient());
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check environment variables
    logEnvStatus();

    // Setup global fetch interceptor for GraphQL requests
    setupGlobalFetchInterceptor();

    // Register default values for missing GraphQL fields
    registerGraphQLDefaults();
  }, []);

  const handleOfflineChange = (offline: boolean) => {
    console.log(`Connectivity status changed: ${offline ? 'Offline' : 'Online'}`);
    setIsOffline(offline);
  };

  if (!mounted) {
    // You can show a loading state here if you want
    return null;
  }

  return (
    <ConnectivityContext.Provider value={{ isOffline, setIsOffline }}>
      <ApolloProvider client={client}>
        <AuthProvider>
          <ListsProvider>
            <ConnectivityChecker 
              onOfflineChange={handleOfflineChange} 
              showAlert={false} // We'll show connectivity alerts in specific components
            />
            {children}
          </ListsProvider>
        </AuthProvider>
      </ApolloProvider>
    </ConnectivityContext.Provider>
  );
}