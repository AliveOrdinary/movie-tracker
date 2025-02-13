// src/app/auth/layout.tsx
import Link from 'next/link';
import { AuthGuard } from '@/components/auth/AuthGuard';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="h-screen bg-slate-50 dark:bg-slate-900 grid lg:grid-cols-2">
        {/* Left side - Hidden on mobile */}
        <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
          <div className="absolute inset-0 bg-zinc-900" />
          <Link 
            href="/"
            className="relative z-20 flex items-center text-lg font-medium"
          >
            CineTrack
          </Link>
          <div className="relative z-20 mt-auto">
            <blockquote className="space-y-2">
              <p className="text-lg">
                &ldquo;Track your favorite movies, discover new ones, and join a community of movie enthusiasts.&rdquo;
              </p>
            </blockquote>
          </div>
        </div>

        {/* Right side - Content */}
        <div className="h-full flex items-center justify-center p-8">
          <div className="w-full max-w-sm space-y-6">
            {children}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}