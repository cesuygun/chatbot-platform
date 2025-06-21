'use client';

import { useAuth } from '@/contexts/auth/AuthContext';

export default function DebugPage() {
  const { user, loading } = useAuth();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Debug Information</h1>
      <div>
        <h2 className="text-xl font-bold">User State</h2>
        <pre>{JSON.stringify({ user, loading }, null, 2)}</pre>
      </div>
    </div>
  );
}
