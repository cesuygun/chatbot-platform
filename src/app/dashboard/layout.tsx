'use client';

import { NavLink } from '@/components/layout/NavLink';
import { SignOutButton } from '@/components/layout/SignOutButton';
import { useAuth } from '@/contexts/auth/AuthContext';
import { Bot, CreditCard, LayoutDashboard, Settings } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-background">
      <aside className="w-64 flex-shrink-0 border-r bg-card p-6 flex flex-col justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-8">Chatbot Platform</h1>
          <nav className="space-y-2">
            <NavLink href="/dashboard" icon={<LayoutDashboard />}>
              Dashboard
            </NavLink>
            <NavLink href="/dashboard/chatbots" icon={<Bot />}>
              Chatbots
            </NavLink>
            <NavLink href="/dashboard/subscription" icon={<CreditCard />}>
              Subscription
            </NavLink>
            <NavLink href="/dashboard/settings" icon={<Settings />}>
              Settings
            </NavLink>
          </nav>
        </div>
        <div>
          <div className="mb-4 text-sm text-muted-foreground truncate" title={user?.email}>
            {user?.email}
          </div>
          <SignOutButton />
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
