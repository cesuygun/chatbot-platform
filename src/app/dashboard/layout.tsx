'use client';

import { useAuth } from '@/contexts/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Settings, Bot, LayoutDashboard, CreditCard } from 'lucide-react';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  if (loading || !user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-gray-800 text-white p-4">
        <h1 className="text-2xl font-bold mb-8">Chatbot Platform</h1>
        <nav>
          <ul>
            <li>
              <Link href="/dashboard" className="flex items-center p-2 rounded hover:bg-gray-700">
                <LayoutDashboard className="h-5 w-5 mr-2" />
                Dashboard
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/chatbots"
                className="flex items-center p-2 rounded hover:bg-gray-700"
              >
                <Bot className="h-5 w-5 mr-2" />
                Chatbots
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/subscription"
                className="flex items-center p-2 rounded hover:bg-gray-700"
              >
                <CreditCard className="h-5 w-5 mr-2" />
                Subscription
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/settings"
                className="flex items-center p-2 rounded hover:bg-gray-700"
              >
                <Settings className="h-5 w-5 mr-2" />
                Settings
              </Link>
            </li>
          </ul>
        </nav>
        <div className="mt-auto">
          <div className="border-t border-gray-700 mt-4 pt-4">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gray-600 mr-2" />
              <span className="text-sm text-gray-400">{user.email}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="w-full justify-start mt-2"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>
      <main className="flex-1 p-8 bg-gray-100">{children}</main>
    </div>
  );
}
