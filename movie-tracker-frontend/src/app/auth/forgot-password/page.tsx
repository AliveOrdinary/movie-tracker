'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation } from '@apollo/client';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { INITIATE_PASSWORD_RESET } from '@/types/graphql/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

// Form validation schema
const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isSubmitSuccess, setIsSubmitSuccess] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const [initiatePasswordReset, { loading }] = useMutation(INITIATE_PASSWORD_RESET, {
    onCompleted: () => {
      setIsSubmitSuccess(true);
      toast({
        title: "Reset link sent",
        description: "If your email is registered, you will receive reset instructions",
      });
    },
    onError: (error) => {
      console.error('Password reset error:', error);
      // For security reasons, don't show specific errors to the user
      toast({
        title: "Reset link sent",
        description: "If your email is registered, you will receive reset instructions",
      });
      // Still set success to true for security reasons (don't reveal if email exists)
      setIsSubmitSuccess(true);
    }
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    await initiatePasswordReset({
      variables: {
        input: {
          email: data.email
        }
      }
    });
  };

  return (
    <>
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Forgot Password</h1>
        {!isSubmitSuccess ? (
          <p className="text-sm text-muted-foreground">
            Enter your email address and we'll send you a link to reset your password
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            If your email address is registered with us, you'll receive instructions to reset your password
          </p>
        )}
      </div>

      <Card className="w-full max-w-md mx-auto mt-4">
        {!isSubmitSuccess ? (
          <>
            <CardHeader>
              <CardTitle>Reset Password</CardTitle>
              <CardDescription>Enter your email to receive a reset link</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    {...register('email')}
                    aria-invalid={!!errors.email}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => router.push('/auth/login')}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Login
                </Button>
              </CardFooter>
            </form>
          </>
        ) : (
          <>
            <CardHeader>
              <CardTitle>Check Your Email</CardTitle>
              <CardDescription>We've sent you instructions to reset your password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-muted-foreground">
                Check your inbox for instructions on how to reset your password. If you don't see the email, check your spam folder.
              </p>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button
                variant="default"
                className="w-full"
                onClick={() => router.push('/auth/login')}
              >
                Return to Login
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setIsSubmitSuccess(false)}
              >
                Try again with a different email
              </Button>
            </CardFooter>
          </>
        )}
      </Card>
    </>
  );
}
