// src/lib/auth/AuthContext.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  GoogleAuthProvider, 
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useApolloClient } from '@apollo/client';
import { usePathname, useRouter } from 'next/navigation';
import { ME_QUERY } from '@/types/graphql/auth';

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
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
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
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Get the user data from our backend
          const { data } = await client.query({
            query: ME_QUERY,
            context: { requiresAuth: true },
            fetchPolicy: 'network-only',
          });

          setState({
            user: data?.me,
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

        // Only redirect on auth errors if not already on an auth page
        if (!pathname?.startsWith('/auth/')) {
          router.push('/auth/login');
        }
      }
    });

    return () => unsubscribe();
  }, [client, pathname, router]);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      await signInWithEmailAndPassword(auth, email, password);
      // The onAuthStateChanged listener will handle updating the state
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error as Error
      }));
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      await auth.signOut();
      // The onAuthStateChanged listener will handle updating the state
      router.push('/auth/login');
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error as Error
      }));
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // The onAuthStateChanged listener will handle updating the state
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error as Error
      }));
      throw error;
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Create the user in Firebase
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update the user's profile with the username
      await updateProfile(firebaseUser, {
        displayName: username
      });

      // The onAuthStateChanged listener will handle updating the state
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error as Error
      }));
      throw error;
    }
  };

  const value = {
    ...state,
    isAuthenticated: !!state.user,
    hasRole: (role: string) => state.user?.roles.includes(role) ?? false,
    signInWithEmail,
    signInWithGoogle,
    signUp,
    signOut,
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