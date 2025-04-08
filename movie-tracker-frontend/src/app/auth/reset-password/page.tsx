'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useMutation } from '@apollo/client';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2, Check, AlertCircle } from 'lucide-react';
import { VERIFY_PASSWORD_RESET_CODE, RESET_PASSWORD } from '@/types/graphql/auth/reset-password';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

// Form validation schema
const resetPasswordSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  newPassword: z.string().min(8, { message: 'Password must be at least 8 characters long' }),
  confirmPassword: z.string().min(8, { message: 'Password must be at least 8 characters long' }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  
  const [verificationStatus, setVerificationStatus] = useState<'verifying' | 'valid' | 'invalid'>('verifying');
  const [email, setEmail] = useState('');
  const [resetComplete, setResetComplete] = useState(false);
  
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  // Verify reset code
  const [verifyCode, { loading: verifying }] = useMutation(VERIFY_PASSWORD_RESET_CODE, {
    onCompleted: (data) => {
      if (data.verifyPasswordResetCode?.isValid) {
        setVerificationStatus('valid');
        setEmail(data.verifyPasswordResetCode.email);
        setValue('email', data.verifyPasswordResetCode.email);
      } else {
        setVerificationStatus('invalid');
        toast({
          variant: "destructive",
          title: "Invalid or expired code",
          description: "This password reset link is invalid or has expired.",
        });
      }
    },
    onError: (error) => {
      console.error('Verification error:', error);
      setVerificationStatus('invalid');
      toast({
        variant: "destructive",
        title: "Verification failed",
        description: "We couldn't verify this reset link. It may be invalid or expired.",
      });
    }
  });

  // Reset password mutation
  const [resetPassword, { loading: resetting }] = useMutation(RESET_PASSWORD, {
    onCompleted: () => {
      setResetComplete(true);
      toast({
        title: "Password reset successful",
        description: "Your password has been reset. You can now login with your new password.",
      });
    },
    onError: (error) => {
      console.error('Password reset error:', error);
      toast({
        variant: "destructive",
        title: "Password reset failed",
        description: error.message || "We couldn't reset your password. Please try again.",
      });
    }
  });

  // Verify code on initial load
  useEffect(() => {
    if (code) {
      verifyCode({
        variables: {
          code
        }
      });
    } else {
      setVerificationStatus('invalid');
      toast({
        variant: "destructive",
        title: "Missing reset code",
        description: "The password reset link appears to be invalid.",
      });
    }
  }, [code, verifyCode]);

  const onSubmit = async (data: ResetPasswordFormValues) => {
    await resetPassword({
      variables: {
        input: {
          email: data.email,
          newPassword: data.newPassword
        }
      }
    });
  };

  if (verificationStatus === 'verifying') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-center text-muted-foreground">
          Verifying your reset link...
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Reset Your Password</h1>
        <p className="text-sm text-muted-foreground">
          {verificationStatus === 'valid' 
            ? resetComplete 
              ? "Your password has been reset successfully." 
              : "Create a new password for your account." 
            : "This password reset link is invalid or has expired."}
        </p>
      </div>

      <Card className="w-full max-w-md mx-auto mt-4">
        {verificationStatus === 'valid' && !resetComplete ? (
          <>
            <CardHeader>
              <CardTitle>Create New Password</CardTitle>
              <CardDescription>Please enter a new password for your account</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    disabled
                    aria-invalid={!!errors.email}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    {...register('newPassword')}
                    aria-invalid={!!errors.newPassword}
                  />
                  {errors.newPassword && (
                    <p className="text-sm text-destructive mt-1">{errors.newPassword.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    {...register('confirmPassword')}
                    aria-invalid={!!errors.confirmPassword}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive mt-1">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={resetting}
                >
                  {resetting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting Password...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => router.push('/auth/login')}
                  type="button"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Login
                </Button>
              </CardFooter>
            </form>
          </>
        ) : verificationStatus === 'valid' && resetComplete ? (
          <>
            <CardHeader>
              <CardTitle>Password Reset Complete</CardTitle>
              <CardDescription>Your password has been reset successfully</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center py-6">
              <div className="rounded-full bg-green-100 p-3 mb-4">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-center text-muted-foreground">
                You can now log in to your account using your new password.
              </p>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={() => router.push('/auth/login')}
              >
                Go to Login
              </Button>
            </CardFooter>
          </>
        ) : (
          <>
            <CardHeader>
              <CardTitle>Invalid Reset Link</CardTitle>
              <CardDescription>This password reset link is invalid or has expired</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center py-6">
              <div className="rounded-full bg-red-100 p-3 mb-4">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <p className="text-center text-muted-foreground">
                Please request a new password reset link to continue.
              </p>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button
                className="w-full"
                onClick={() => router.push('/auth/forgot-password')}
              >
                Request New Reset Link
              </Button>
              <Button 
                variant="ghost" 
                className="w-full"
                onClick={() => router.push('/auth/login')}
              >
                Back to Login
              </Button>
            </CardFooter>
          </>
        )}
      </Card>
    </>
  );
}
