// src/lib/utils/debugAuth.ts
import { getApolloClient } from '../apollo/client';
import { auth } from '../firebase/config';

/**
 * A utility function to help debug authentication issues in the browser console
 */
export const debugAuth = async () => {
  const client = getApolloClient();
  const firebaseUser = auth.currentUser;
  
  console.group('🔍 Authentication Debug Info');
  
  console.log('Firebase User:', 
    firebaseUser 
      ? {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          emailVerified: firebaseUser.emailVerified,
          displayName: firebaseUser.displayName,
          isAnonymous: firebaseUser.isAnonymous,
          metadata: firebaseUser.metadata
        } 
      : 'Not signed in'
  );
  
  // Get Apollo cache data
  try {
    const cache = client.cache.extract();
    const meQueries = Object.keys(cache).filter(key => key.includes('Me'));
    
    console.log('Apollo Cache User Data:');
    if (meQueries.length > 0) {
      meQueries.forEach(key => {
        console.log(`- ${key}:`, cache[key]);
      });
    } else {
      console.log('No user data found in Apollo cache');
    }
  } catch (error) {
    console.error('Error inspecting Apollo cache:', error);
  }
  
  // Check local storage
  console.log('Local Storage Auth Items:');
  Object.keys(localStorage).forEach(key => {
    if (key.includes('firebase') || key.includes('auth') || key.includes('user') || key.includes('token')) {
      console.log(`- ${key}: [Exists]`);
    }
  });
  
  // Check cookies
  console.log('Cookies (Auth-related):');
  document.cookie.split(';').forEach(cookie => {
    const trimmedCookie = cookie.trim();
    if (
      trimmedCookie.includes('firebase') || 
      trimmedCookie.includes('auth') || 
      trimmedCookie.includes('user') || 
      trimmedCookie.includes('token')
    ) {
      console.log(`- ${trimmedCookie.split('=')[0]}: [Exists]`);
    }
  });
  
  // Check for third-party cookie blocking
  try {
    const testCookieName = 'auth_debug_test';
    document.cookie = `${testCookieName}=1; SameSite=None; Secure`;
    const cookieExists = document.cookie.includes(testCookieName);
    
    console.log('Third-party Cookie Test:', cookieExists 
      ? '✅ Cookies are working correctly' 
      : '❌ Third-party cookies may be blocked');
      
    // Clean up test cookie
    document.cookie = `${testCookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  } catch (error) {
    console.error('Error testing cookies:', error);
  }
  
  // Check network status
  console.log('Network Status:', navigator.onLine ? '🟢 Online' : '🔴 Offline');
  
  console.groupEnd();
  
  return 'Auth debug complete. See console for details.';
};

// Add to window for easy access in browser console
if (typeof window !== 'undefined') {
  (window as any).debugAuth = debugAuth;
}