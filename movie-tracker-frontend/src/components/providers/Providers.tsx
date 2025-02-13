import { ApolloProvider } from '@apollo/client';
import { createApolloClient } from '@/lib/apollo';
import { AuthProvider } from '@/lib/auth/AuthContext';

const apolloClient = createApolloClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ApolloProvider client={apolloClient}>
      <AuthProvider>{children}</AuthProvider>
    </ApolloProvider>
  );
}