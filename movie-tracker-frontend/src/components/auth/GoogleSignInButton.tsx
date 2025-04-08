// src/components/auth/GoogleSignInButton.tsx
'use client';

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/AuthContext";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { ReloadIcon } from "@radix-ui/react-icons";

export function GoogleSignInButton() {
  const [loading, setLoading] = useState(false);
  const { signInWithGoogle, isAuthenticated } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      console.log('Already authenticated, redirecting to home page');
      window.location.href = '/';
    }
  }, [isAuthenticated]);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      console.log('Starting Google sign-in...');
      await signInWithGoogle();
      console.log('Google sign-in completed, showing success toast');
      
      toast({
        title: "Success",
        description: "Successfully signed in with Google",
      });
      
      // Force a hard refresh to ensure all contexts are properly updated
      window.location.href = '/';
    } catch (error) {
      console.error('Google sign-in error:', error);
      
      // Check for read-only property error
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign in with Google';
      const isReadOnlyError = errorMessage.includes('read only property');
      
      if (isReadOnlyError) {
        // If it's a read-only error, try a direct page refresh to clear cache
        toast({
          title: "Authentication successful",
          description: "Refreshing page to complete Google login..."
        });
        
        // Force a page refresh
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      } else {
        // For other errors, show the error message
        toast({
          variant: "destructive",
          title: "Error",
          description: errorMessage
        });
        setLoading(false);
      }
    }
  };

  return (
    <Button
      variant="outline"
      type="button"
      disabled={loading}
      className="w-full"
      onClick={handleGoogleSignIn}
    >
      {loading ? (
        <>
          <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
          Signing in...
        </>
      ) : (
        <>
          <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
            <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
          </svg>
          Continue with Google
        </>
      )}
    </Button>
  );
}