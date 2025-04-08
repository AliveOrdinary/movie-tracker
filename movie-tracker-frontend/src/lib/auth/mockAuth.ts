// src/lib/auth/mockAuth.ts
// This file provides mock authentication utilities for development when Firebase credentials are missing

/**
 * Mock user type that mirrors Firebase User properties we use
 */
export interface MockUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  getIdToken: () => Promise<string>;
}

/**
 * Create a mock user for testing and development
 */
export const createMockUser = (
  options?: Partial<MockUser>
): MockUser => ({
  uid: options?.uid || 'mock-user-123',
  email: options?.email || 'mockuser@example.com',
  displayName: options?.displayName || 'Mock User',
  photoURL: options?.photoURL || null,
  emailVerified: options?.emailVerified ?? true,
  getIdToken: () => Promise.resolve('mock-jwt-token'),
});

/**
 * Mock implementation of Firebase Auth's API
 */
export const createMockAuth = () => {
  let currentUser: MockUser | null = null;
  let listeners: ((user: MockUser | null) => void)[] = [];

  const notifyListeners = () => {
    listeners.forEach(listener => listener(currentUser));
  };

  return {
    currentUser,
    
    // Mock auth state observer
    onAuthStateChanged: (callback: (user: MockUser | null) => void) => {
      listeners.push(callback);
      // Call immediately with current user
      callback(currentUser);
      // Return unsubscribe function
      return () => {
        listeners = listeners.filter(listener => listener !== callback);
      };
    },
    
    // Mock sign in methods
    signInWithEmailAndPassword: async (email: string, password: string) => {
      currentUser = createMockUser({ email });
      notifyListeners();
      return { user: currentUser };
    },
    
    createUserWithEmailAndPassword: async (email: string, password: string) => {
      currentUser = createMockUser({ email, emailVerified: false });
      notifyListeners();
      return { user: currentUser };
    },
    
    signInWithPopup: async () => {
      currentUser = createMockUser({
        email: 'google-user@example.com',
        displayName: 'Google User'
      });
      notifyListeners();
      return { user: currentUser };
    },
    
    // Mock sign out
    signOut: async () => {
      currentUser = null;
      notifyListeners();
      return Promise.resolve();
    },
    
    // Additional methods that may be used
    sendPasswordResetEmail: async () => Promise.resolve(),
    sendEmailVerification: async () => Promise.resolve(),
    
    // Profile update
    updateProfile: async (user: MockUser, profile: { displayName?: string; photoURL?: string }) => {
      if (currentUser && user.uid === currentUser.uid) {
        currentUser = {
          ...currentUser,
          displayName: profile.displayName || currentUser.displayName,
          photoURL: profile.photoURL || currentUser.photoURL
        };
        notifyListeners();
      }
      return Promise.resolve();
    }
  };
};
