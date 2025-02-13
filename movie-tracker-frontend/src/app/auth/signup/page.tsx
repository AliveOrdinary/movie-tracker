// src/app/auth/signup/page.tsx
import { Metadata } from 'next';
import { SignUpForm } from '@/components/auth/SignUpForm';

export const metadata: Metadata = {
  title: 'Create Account | CineTrack',
  description: 'Create your CineTrack account',
};

export default function SignUpPage() {
  return (
    <>
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
        <p className="text-sm text-muted-foreground">
          Enter your details to create your account
        </p>
      </div>
      <SignUpForm />
    </>
  );
}