// src/lib/firebase/config.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { createMockAuth } from '../auth/mockAuth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyAcDu7I7wJq5FH6LvdXmQXL7XFD8HoMWLA',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'cine-track.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'cine-track',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'cine-track.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '308346854933',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:308346854933:web:fe2e60767ed0ab3e3cb81c'
};

// Validate configuration before initializing
const isFirebaseConfigValid = () => {
  return (
    firebaseConfig.apiKey !== '' &&
    firebaseConfig.authDomain !== '' &&
    firebaseConfig.projectId !== '' &&
    firebaseConfig.appId !== ''
  );
};

// Initialize Firebase with error handling
let app;
let auth;

try {
  if (isFirebaseConfigValid()) {
    console.log('Initializing Firebase with valid configuration');
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    
    // Connect to Auth Emulator in development if needed
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_AUTH_EMULATOR === 'true') {
      connectAuthEmulator(auth, 'http://localhost:9099');
    }
  } else {
    console.warn('Firebase configuration is invalid or missing. Using mock authentication for development.');
    // Use mock auth instead
    app = null;
    auth = createMockAuth();
  }
} catch (error) {
  console.error('Error initializing Firebase:', error);
  // Use mock auth as fallback
  app = null;
  auth = createMockAuth();
}

export { app, auth };
