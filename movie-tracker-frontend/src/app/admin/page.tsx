// app/admin/page.tsx
'use client';

import AdminDashboard from '@/components/admin/AdminDashboard';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { UserRole } from '@/types/auth';

export default function AdminPage() {
  return (
    <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
      <AdminDashboard />
    </ProtectedRoute>
  );
}