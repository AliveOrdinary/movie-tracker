import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export function ProtectedRoute({ children, requiredRoles = [] }: ProtectedRouteProps) {
  const { isAuthenticated, loading, hasRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }

    if (!loading && isAuthenticated && requiredRoles.length > 0) {
      const hasRequiredRole = requiredRoles.some(role => hasRole(role));
      if (!hasRequiredRole) {
        router.push('/unauthorized');
      }
    }
  }, [loading, isAuthenticated, requiredRoles, hasRole, router]);

  if (loading) {
    return <div>Loading...</div>; // Replace with your loading component
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requiredRoles.length > 0 && !requiredRoles.some(role => hasRole(role))) {
    return null;
  }

  return <>{children}</>;
}