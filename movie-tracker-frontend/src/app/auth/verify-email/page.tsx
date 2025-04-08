'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation } from '@apollo/client';
import { VERIFY_EMAIL } from '@/types/graphql/auth';
import { useAuth } from '@/lib/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { ReloadIcon, CheckCircledIcon } from '@radix-ui/react-icons';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [verificationMessage, setVerificationMessage] = useState('Verifying your email...');

  const [verifyEmail, { loading }] = useMutation(VERIFY_EMAIL, {
    onCompleted: () => {
      setVerificationStatus('success');
      setVerificationMessage('Your email has been verified successfully!');
      toast({
        title: "Email verified",
        description: "Your email has been verified successfully.",
      });
    },
    onError: (error) => {
      console.error('Email verification error:', error);
      setVerificationStatus('error');
      setVerificationMessage('Failed to verify email. Please try again later.');
      toast({
        variant: "destructive",
        title: "Verification failed",
        description: error.message || "Failed to verify your email",
      });
    }
  });

  useEffect(() => {
    // If user is already verified, redirect to dashboard
    if (user?.emailVerified) {
      router.push('/dashboard');
      return;
    }

    // If the user is logged in and not verified, attempt verification
    if (user && !user.emailVerified && !authLoading) {
      verifyEmail();
    }
  }, [user, authLoading, router, verifyEmail]);

  return (
    <div className="max-w-md mx-auto mt-8">
      <Card>
        <CardHeader>
          <CardTitle>Email Verification</CardTitle>
          <CardDescription>
            Verifying your email address
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4">
          {verificationStatus === 'pending' && (
            <div className="flex flex-col items-center space-y-4 py-6">
              <ReloadIcon className="h-10 w-10 animate-spin text-primary" />
              <p className="text-center">{verificationMessage}</p>
            </div>
          )}

          {verificationStatus === 'success' && (
            <div className="flex flex-col items-center space-y-4 py-6">
              <CheckCircledIcon className="h-10 w-10 text-green-500" />
              <p className="text-center">{verificationMessage}</p>
            </div>
          )}

          {verificationStatus === 'error' && (
            <div className="flex flex-col items-center space-y-4 py-6">
              <div className="rounded-full bg-red-100 p-2">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <p className="text-center">{verificationMessage}</p>
              <Button onClick={() => verifyEmail()}>
                Try Again
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          {verificationStatus === 'success' && (
            <Button onClick={() => router.push('/dashboard')}>
              Go to Dashboard
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
