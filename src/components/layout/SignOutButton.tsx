'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth/AuthContext';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export const SignOutButton = () => {
  const { signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <Button variant="ghost" className="w-full justify-start" onClick={handleSignOut}>
      <LogOut className="mr-2 h-4 w-4" />
      Sign Out
    </Button>
  );
};
