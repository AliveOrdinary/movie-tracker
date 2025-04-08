// src/lib/utils/checkEnv.ts
/**
 * Utility to check and validate environment variables
 */

// Firebase config variables
const FIREBASE_ENV_VARS = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
];

// Backend API variables
const API_ENV_VARS = [
  'NEXT_PUBLIC_API_URL'
];

/**
 * Check if Firebase environment variables are properly configured
 */
export const isFirebaseConfigured = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return FIREBASE_ENV_VARS.every(varName => {
    const value = process.env[varName];
    return value !== undefined && value !== '';
  });
};

/**
 * Check if API environment variables are properly configured
 */
export const isApiConfigured = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return API_ENV_VARS.every(varName => {
    const value = process.env[varName];
    return value !== undefined && value !== '';
  });
};

/**
 * Get a list of missing environment variables
 */
export const getMissingEnvVars = (): string[] => {
  if (typeof window === 'undefined') return [];
  
  const allVars = [...FIREBASE_ENV_VARS, ...API_ENV_VARS];
  return allVars.filter(varName => {
    const value = process.env[varName];
    return value === undefined || value === '';
  });
};

/**
 * Check if all required environment variables are configured
 */
export const areAllEnvVarsConfigured = (): boolean => {
  return isFirebaseConfigured() && isApiConfigured();
};

/**
 * Log environment variable status to console
 */
export const logEnvStatus = (): void => {
  if (process.env.NODE_ENV !== 'production') {
    const missingVars = getMissingEnvVars();
    
    if (missingVars.length > 0) {
      console.warn('⚠️ Missing environment variables:', missingVars.join(', '));
      console.warn('See .env.example for required variables');
    } else {
      console.log('✅ All environment variables configured');
    }
    
    console.log('Firebase config status:', isFirebaseConfigured() ? '✅' : '❌');
    console.log('API config status:', isApiConfigured() ? '✅' : '❌');
  }
};
