import { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { auth } from '../firebase';
import { useApolloClient } from '@apollo/client';
import { ME_QUERY } from '@/graphql/auth';

interface User {
  id: string;
  email: string;
  username: string;
  roles: string[];
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  error: Error | null;
}

interface AuthContextType extends AuthState {
  isAuthenticated: boolean;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    firebaseUser: null,
    loading: true,
    error: null,
  });
  const client = useApolloClient();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Get the user data from our backend
          const { data } = await client.query({
            query: ME_QUERY,
            fetchPolicy: 'network-only',
          });

          setState({
            user: data.me,
            firebaseUser,
            loading: false,
            error: null,
          });
        } else {
          setState({
            user: null,
            firebaseUser: null,
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error as Error,
        }));
      }
    });

    return () => unsubscribe();
  }, [client]);

  const value = {
    ...state,
    isAuthenticated: !!state.user,
    hasRole: (role: string) => state.user?.roles.includes(role) ?? false,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}