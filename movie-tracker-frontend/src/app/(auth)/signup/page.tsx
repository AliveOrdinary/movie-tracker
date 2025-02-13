import { SignUpForm } from '@/components/auth/SignUpForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up | Movie Tracker',
  description: 'Create your Movie Tracker account',
};

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <SignUpForm />
    </div>
  );
}