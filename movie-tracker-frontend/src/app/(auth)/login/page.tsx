import { LoginForm } from '@/components/auth/LoginForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login | Movie Tracker',
  description: 'Sign in to your Movie Tracker account',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <LoginForm />
    </div>
  );
}