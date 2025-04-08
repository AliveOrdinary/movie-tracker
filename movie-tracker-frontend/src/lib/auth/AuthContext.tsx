// src/lib/auth/AuthContext.tsx
'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
  User as FirebaseUser, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  GoogleAuthProvider, 
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { ApolloLink, from, useApolloClient } from '@apollo/client';
import { usePathname, useRouter } from 'next/navigation';
import { ME_QUERY, LOGIN_MUTATION, LOGOUT_MUTATION } from '@/types/graphql/auth';
import { setContext } from '@apollo/client/link/context';
import { toast } from '@/hooks/use-toast';

// Enum normalization is no longer needed as backend now consistently uses UPPERCASE



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
  isFirebaseAvailable: boolean;
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

// Check if Firebase auth is properly initialized
const isFirebaseAvailable = () => {
  return auth && typeof auth !== 'string' && typeof auth.onAuthStateChanged === 'function';
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    firebaseUser: null,
    loading: true,
    error: null,
    isFirebaseAvailable: isFirebaseAvailable(),
  });

  const client = useApolloClient();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // If Firebase is not available, set loading to false and return
    if (!state.isFirebaseAvailable) {
      console.warn('Firebase Auth is not available. Authentication features will be disabled.');
      setState(prev => ({ ...prev, loading: false }));
      return () => {};
    }
    
    // Immediately force a token refresh when starting up
    if (auth.currentUser) {
      console.log('Forcing initial token refresh on startup');
      auth.currentUser.getIdToken(true)
        .then(token => {
          console.log('Initial token refresh successful');
          localStorage.setItem('auth_token', token);
        })
        .catch(err => {
          console.error('Initial token refresh failed:', err);
        });
    }

    // Set up a token refresh interval
    let tokenRefreshInterval: NodeJS.Timeout;
    
    const setupTokenRefreshInterval = () => {
      // Clear any existing interval
      if (tokenRefreshInterval) {
        clearInterval(tokenRefreshInterval);
      }
      
      // Set up a new interval to refresh token every 45 minutes
      // This is less than Firebase's default 1 hour expiration
      tokenRefreshInterval = setInterval(async () => {
        try {
          if (auth.currentUser) {
            console.log('Refreshing Firebase token via interval');
            const freshToken = await auth.currentUser.getIdToken(true);
            localStorage.setItem('auth_token', freshToken);
            console.log('Token refreshed successfully');
          } else {
            console.log('No current user, skipping token refresh');
          }
        } catch (err) {
          console.warn('Background token refresh failed:', err);
        }
      }, 45 * 60 * 1000); // 45 minutes
    };

    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      console.log('Firebase Auth State Changed:', firebaseUser);
      
      try {
        if (firebaseUser) {
          const token = await firebaseUser.getIdToken();
          console.log('Got Firebase token');
          
          // Store token in localStorage as a backup mechanism
          localStorage.setItem('auth_token', token);
          
          // Set up a refresh token timer
          const tokenRefreshMinutes = 50; // Refresh before the 60-minute expiration
          setTimeout(async () => {
            try {
              if (auth.currentUser) {
                const freshToken = await auth.currentUser.getIdToken(true);
                localStorage.setItem('auth_token', freshToken);
                console.log('Token refreshed in background');
              }
            } catch (err) {
              console.warn('Background token refresh failed:', err);
            }
          }, tokenRefreshMinutes * 60 * 1000);
          
          // Also setup the interval-based token refresh
          setupTokenRefreshInterval();
          
          // Update the Apollo client authorization header
          client.setLink(
            from([
              setContext(async (_, { headers }) => ({
                headers: {
                  ...headers,
                  authorization: `Bearer ${token}`,
                },
              })),
              client.link as ApolloLink,
            ])
          );

          try {
          console.log('Fetching user data from backend...');
          const { data } = await client.query({
          query: ME_QUERY,
            fetchPolicy: 'network-only',
              });

          // Check if data and data.me exist
          if (data && data.me) {
          console.log('User data received from backend:', data.me);
          
          // Enum normalization no longer needed
          const userData = data.me;
          console.log('User data from backend:', userData);
            
                setState({
                  user: userData,
                  firebaseUser,
                  loading: false,
                  error: null,
                  isFirebaseAvailable: true,
                });
              } else {
                console.warn('Backend returned null for user data, attempting login mutation...');
                
                // If the ME query returns null, try to explicitly login with the Firebase UID
                try {
                  console.log('Attempting login mutation with firebaseUid:', firebaseUser.uid);
                  const { data: loginData } = await client.mutate({
                    mutation: LOGIN_MUTATION,
                    variables: {
                      input: {
                        firebaseUid: firebaseUser.uid
                      }
                    },
                    fetchPolicy: 'no-cache', // Force to skip cache to get fresh data
                  });
                  
                  if (loginData?.login?.user) {
                    console.log('Login mutation successful, user data:', loginData.login.user);
                    
                    // No enum normalization needed
                    const loginUserData = loginData.login.user;
                    console.log('Login user data from backend:', loginUserData);
                    
                    // Update Apollo client with the new token if provided
                    if (loginData.login.token) {
                      console.log('Setting authorization token from login response');
                      client.setLink(
                        from([
                          setContext(async (_, { headers }) => ({
                            headers: {
                              ...headers,
                              authorization: `Bearer ${loginData.login.token}`,
                            },
                          })),
                          client.link as ApolloLink,
                        ])
                      );
                    }
                    
                    setState({
                      user: loginUserData,
                      firebaseUser,
                      loading: false,
                      error: null,
                      isFirebaseAvailable: true,
                    });
                  } else {
                    console.error('Login mutation failed to return user data');
                    setState({
                      user: null,
                      firebaseUser,
                      loading: false,
                      error: new Error('Failed to get user data from backend'),
                      isFirebaseAvailable: true,
                    });
                  }
                } catch (loginError) {
                  console.error('Error during login mutation:', loginError);
                  setState({
                    user: null,
                    firebaseUser,
                    loading: false,
                    error: loginError as Error,
                    isFirebaseAvailable: true,
                  });
                }
              }
            } catch (graphqlError) {
            console.error('GraphQL error fetching user data:', graphqlError);
            
            // Special handling for rate limit errors
            if (graphqlError.message && graphqlError.message.includes('429')) {
              console.warn('Rate limit exceeded, using cached data if available');
              // Try to get user from cache
              try {
                const cachedData = client.readQuery({ query: ME_QUERY });
                if (cachedData && cachedData.me) {
                console.log('Using cached user data');
                setState({
                user: cachedData.me,
                firebaseUser,
                loading: false,
                error: null,
                isFirebaseAvailable: true,
                });
                return;
                }
              } catch (cacheError) {
                console.warn('No valid user data in cache');
              }
            }
            setState({
              user: null,
              firebaseUser,
              loading: false,
              error: graphqlError as Error,
              isFirebaseAvailable: true,
            });
          }
        } else {
          setState({
            user: null,
            firebaseUser: null,
            loading: false,
            error: null,
            isFirebaseAvailable: true,
          });
          
          // Clear Apollo cache on logout
          await client.clearStore();
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        setState(prev => ({
          ...prev,
          loading: false,
          error: error as Error,
        }));
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
      
      // Clear the token refresh interval when component unmounts
      if (tokenRefreshInterval) {
        clearInterval(tokenRefreshInterval);
      }
    };
  }, [client, pathname, state.isFirebaseAvailable]);

  const signInWithEmail = async (email: string, password: string) => {
    if (!state.isFirebaseAvailable) {
      toast({
        title: "Authentication Error",
        description: "Firebase authentication is not properly configured",
        variant: "destructive"
      });
      throw new Error('Firebase authentication is not properly configured');
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Firebase sign-in successful:', userCredential.user);

      // Immediately get token and set up Apollo client
      const token = await userCredential.user.getIdToken();
      console.log('Got Firebase token, updating Apollo client');
      
      // Store token in localStorage as a backup mechanism
      localStorage.setItem('auth_token', token);
      
      // Update the Apollo client authorization header
      client.setLink(
        from([
          setContext(async (_, { headers }) => ({
            headers: {
              ...headers,
              authorization: `Bearer ${token}`,
            },
          })),
          client.link as ApolloLink,
        ])
      );

      // Immediately fetch user data instead of waiting for onAuthStateChanged
      try {
        console.log('Fetching user data from backend...');
        const { data } = await client.query({
          query: ME_QUERY,
          fetchPolicy: 'network-only',
        });

        // Check if data and data.me exist
        if (data && data.me) {
          console.log('User data received from backend:', data.me);
          
          // No enum normalization needed anymore
          const userData = data.me;
          
          setState({
            user: userData,
            firebaseUser: userCredential.user,
            loading: false,
            error: null,
            isFirebaseAvailable: true,
          });
        } else {
          console.warn('Backend returned null for user data after email login, attempting login mutation...');
          
          // If the ME query returns null, try to explicitly login with the Firebase UID
          try {
            console.log('Attempting login mutation with firebaseUid:', userCredential.user.uid);
            const { data: loginData } = await client.mutate({
              mutation: LOGIN_MUTATION,
              variables: {
                input: {
                  firebaseUid: userCredential.user.uid
                }
              },
              fetchPolicy: 'no-cache', // Force to skip cache to get fresh data
            });
            
            if (loginData?.login?.user) {
              console.log('Login mutation successful, user data:', loginData.login.user);
              
              // No enum normalization needed
              const loginUserData = loginData.login.user;
              
              // Update Apollo client with the new token if provided
              if (loginData.login.token) {
                console.log('Setting authorization token from login response');
                client.setLink(
                  from([
                    setContext(async (_, { headers }) => ({
                      headers: {
                        ...headers,
                        authorization: `Bearer ${loginData.login.token}`,
                      },
                    })),
                    client.link as ApolloLink,
                  ])
                );
              }
              
              setState({
                user: loginUserData,
                firebaseUser: userCredential.user,
                loading: false,
                error: null,
                isFirebaseAvailable: true,
              });
            } else {
              console.error('Login mutation failed to return user data');
              setState({
                user: null,
                firebaseUser: userCredential.user,
                loading: false,
                error: new Error('Failed to get user data from backend'),
                isFirebaseAvailable: true,
              });
            }
          } catch (loginError) {
            console.error('Error during login mutation:', loginError);
            setState({
              user: null,
              firebaseUser: userCredential.user,
              loading: false,
              error: loginError as Error,
              isFirebaseAvailable: true,
            });
          }
        }
      } catch (graphqlError) {
        console.error('GraphQL error fetching user data:', graphqlError);
        setState({
          user: null,
          firebaseUser: userCredential.user,
          loading: false,
          error: graphqlError as Error,
          isFirebaseAvailable: true,
        });
        throw graphqlError;
      }
    } catch (error) {
      console.error('Login error:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error as Error
      }));
      throw error;
    }
  };

  // Function to reset Apollo cache and state
  const resetClientState = useCallback(async () => {
    try {
      // Clear Apollo cache
      await client.clearStore();
      // Reset the client state for auth related fields
      client.cache.modify({
        fields: {
          me: () => null,
          myLists: () => [],
          watchHistory: () => []
        }
      });
      console.log('Apollo client state reset successfully');
    } catch (error) {
      console.error('Error resetting Apollo client state:', error);
    }
  }, [client]);

  const signOut = async () => {
    if (!state.isFirebaseAvailable) {
      setState({
        user: null,
        firebaseUser: null,
        loading: false,
        error: null,
        isFirebaseAvailable: false,
      });
      router.push('/auth/login');
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      console.log('Signing out...');
      
      // First reset the Apollo client state to clear any cached user data
      await resetClientState();
      
      // Try to logout from backend next
      try {
        await client.mutate({
          mutation: LOGOUT_MUTATION
        });
        console.log('Backend logout successful');
      } catch (error) {
        console.warn('Backend logout failed, continuing with Firebase logout', error);
      }
      
      // Now sign out from Firebase regardless of backend result
      await auth.signOut();
      
      // Clear auth token from localStorage
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');
      
      // Update state immediately rather than waiting for auth state change
      setState({
        user: null,
        firebaseUser: null,
        loading: false,
        error: null,
        isFirebaseAvailable: true,
      });
      
      console.log('Sign out successful, redirecting to login page');
      
      // Navigate to login page
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error as Error
      }));
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    if (!state.isFirebaseAvailable) {
      toast({
        title: "Authentication Error",
        description: "Firebase authentication is not properly configured",
        variant: "destructive"
      });
      throw new Error('Firebase authentication is not properly configured');
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      console.log('Google sign-in successful:', userCredential.user);
      
      // Immediately get token and set up Apollo client
      const token = await userCredential.user.getIdToken();
      console.log('Got Firebase token from Google auth, updating Apollo client');
      
      // Store token in localStorage as a backup mechanism
      localStorage.setItem('auth_token', token);
      
      // Update the Apollo client authorization header
      client.setLink(
        from([
          setContext(async (_, { headers }) => ({
            headers: {
              ...headers,
              authorization: `Bearer ${token}`,
            },
          })),
          client.link as ApolloLink,
        ])
      );

      // Immediately fetch user data instead of waiting for onAuthStateChanged
      try {
        console.log('Fetching user data from backend after Google login...');
        const { data } = await client.query({
          query: ME_QUERY,
          fetchPolicy: 'network-only',
        });

        // Check if data and data.me exist
        if (data && data.me) {
          console.log('User data received from backend after Google login:', data.me);
          
          // No enum normalization needed anymore
          const userData = data.me;
          
          setState({
            user: userData,
            firebaseUser: userCredential.user,
            loading: false,
            error: null,
            isFirebaseAvailable: true,
          });
        } else {
          console.warn('Backend returned null for user data after Google login, attempting login mutation...');
          
          // If the ME query returns null, try to explicitly login with the Firebase UID
          try {
            console.log('Attempting login mutation with firebaseUid after Google login:', userCredential.user.uid);
            const { data: loginData } = await client.mutate({
              mutation: LOGIN_MUTATION,
              variables: {
                input: {
                  firebaseUid: userCredential.user.uid
                }
              },
              fetchPolicy: 'no-cache', // Force to skip cache to get fresh data
            });
            
            if (loginData?.login?.user) {
              console.log('Login mutation successful after Google login, user data:', loginData.login.user);
              
              // No enum normalization needed
              const loginUserData = loginData.login.user;
              
              // Update Apollo client with the new token if provided
              if (loginData.login.token) {
                console.log('Setting authorization token from Google login response');
                client.setLink(
                  from([
                    setContext(async (_, { headers }) => ({
                      headers: {
                        ...headers,
                        authorization: `Bearer ${loginData.login.token}`,
                      },
                    })),
                    client.link as ApolloLink,
                  ])
                );
              }
              
              setState({
                user: loginUserData,
                firebaseUser: userCredential.user,
                loading: false,
                error: null,
                isFirebaseAvailable: true,
              });
            } else {
              console.error('Login mutation failed to return user data after Google login');
              setState({
                user: null,
                firebaseUser: userCredential.user,
                loading: false,
                error: new Error('Failed to get user data from backend after Google login'),
                isFirebaseAvailable: true,
              });
            }
          } catch (loginError) {
            console.error('Error during login mutation after Google login:', loginError);
            setState({
              user: null,
              firebaseUser: userCredential.user,
              loading: false,
              error: loginError as Error,
              isFirebaseAvailable: true,
            });
          }
        }
      } catch (graphqlError) {
        console.error('GraphQL error fetching user data after Google login:', graphqlError);
        setState({
          user: null,
          firebaseUser: userCredential.user,
          loading: false,
          error: graphqlError as Error,
          isFirebaseAvailable: true,
        });
        throw graphqlError;
      }
    } catch (error) {
      console.error('Google login error:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error as Error
      }));
      throw error;
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    if (!state.isFirebaseAvailable) {
      toast({
        title: "Authentication Error",
        description: "Firebase authentication is not properly configured",
        variant: "destructive"
      });
      throw new Error('Firebase authentication is not properly configured');
    }

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

  // Add debug effect to monitor state changes
  useEffect(() => {
    if (state.user) {
      console.log('AuthContext state updated with user:', { 
        id: state.user.id,
        email: state.user.email,
        isAuthenticated: !!state.user
      });
    } else if (!state.loading) {
      console.log('AuthContext state updated: Not authenticated');
    }

    // Check for third-party cookie blocking
    if (state.firebaseUser && !state.user && !state.loading) {
      console.warn('⚠️ Firebase user exists but backend user is null. This may be due to third-party cookie blocking.');
      
      // Simple test for third-party cookie blocking
      const testCookie = () => {
        document.cookie = 'testCookie=1; SameSite=None; Secure';
        return document.cookie.indexOf('testCookie=') !== -1;
      };
      
      if (!testCookie()) {
        console.error('⛔ Third-party cookies appear to be blocked. Authentication may not work correctly.');
        toast({
          title: "Authentication Warning",
          description: "Third-party cookies appear to be blocked in your browser, which may affect authentication. Please check your browser settings.",
          variant: "destructive"
        });
      }
    }
  }, [state.user, state.firebaseUser, state.loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}