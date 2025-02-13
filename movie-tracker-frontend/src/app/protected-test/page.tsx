'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function ProtectedTestPage() {
  return (
    <ProtectedRoute>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Protected Page</h1>
        <p>If you can see this, you're authenticated!</p>
      </div>
    </ProtectedRoute>
  );
}