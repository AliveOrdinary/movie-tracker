import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Forgot Password | Movie Tracker',
  description: 'Reset your Movie Tracker password',
};

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <ForgotPasswordForm />
    </div>
  );
}