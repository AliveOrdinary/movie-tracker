'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { SEND_EMAIL_VERIFICATION, VERIFY_EMAIL } from '@/types/graphql/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { ReloadIcon, CheckCircledIcon } from '@radix-ui/react-icons';

interface EmailVerificationFormProps {
  email: string;
  onVerificationComplete: () => void;
}

export function EmailVerificationForm({ email, onVerificationComplete }: EmailVerificationFormProps) {
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'sent' | 'verifying' | 'success' | 'error'>('idle');

  // Send verification email mutation
  const [sendEmailVerification, { loading: sendingEmail }] = useMutation(SEND_EMAIL_VERIFICATION, {
    onCompleted: () => {
      setVerificationStatus('sent');
      toast({
        title: "Verification email sent",
        description: `We've sent a verification link to ${email}`,
      });
    },
    onError: (error) => {
      console.error('Error sending verification email:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send verification email. Please try again.",
      });
    }
  });

  // Verify email mutation
  const [verifyEmail, { loading: verifying }] = useMutation(VERIFY_EMAIL, {
    onCompleted: () => {
      setVerificationStatus('success');
      toast({
        title: "Success",
        description: "Your email has been verified successfully.",
      });
      onVerificationComplete();
    },
    onError: (error) => {
      console.error('Error verifying email:', error);
      setVerificationStatus('error');
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to verify your email. Please try again.",
      });
    }
  });

  const handleSendVerification = async () => {
    await sendEmailVerification();
  };

  const handleVerifyEmail = async () => {
    setVerificationStatus('verifying');
    await verifyEmail();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Verify Your Email</CardTitle>
        <CardDescription>
          {verificationStatus === 'idle' && `Verify your email address (${email}) to access all features`}
          {verificationStatus === 'sent' && "We've sent a verification link to your email"}
          {verificationStatus === 'verifying' && "Verifying your email..."}
          {verificationStatus === 'success' && "Your email has been verified successfully!"}
          {verificationStatus === 'error' && "Failed to verify your email. Please try again."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {verificationStatus === 'idle' && (
          <p className="text-sm text-muted-foreground">
            Please verify your email address to unlock all features. We'll send you a verification link.
          </p>
        )}
        {verificationStatus === 'sent' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Check your inbox for a verification link. If you don't see it, check your spam folder.
            </p>
            <p className="text-sm text-muted-foreground">
              Click the link in the email, then click the button below to complete verification.
            </p>
          </div>
        )}
        {verificationStatus === 'verifying' && (
          <div className="flex justify-center py-6">
            <ReloadIcon className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        {verificationStatus === 'success' && (
          <div className="flex justify-center py-6">
            <CheckCircledIcon className="h-8 w-8 text-green-500" />
          </div>
        )}
        {verificationStatus === 'error' && (
          <p className="text-sm text-destructive">
            We couldn't verify your email. Please try again or contact support if the problem persists.
          </p>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        {verificationStatus === 'idle' && (
          <Button onClick={handleSendVerification} disabled={sendingEmail}>
            {sendingEmail ? (
              <>
                <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              'Send Verification Email'
            )}
          </Button>
        )}
        {verificationStatus === 'sent' && (
          <Button onClick={handleVerifyEmail} disabled={verifying}>
            {verifying ? (
              <>
                <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'I've Clicked the Link'
            )}
          </Button>
        )}
        {(verificationStatus === 'error') && (
          <Button onClick={handleSendVerification}>
            Try Again
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
