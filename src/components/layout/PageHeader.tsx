import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth/AuthContext';

export function PageHeader() {
  const { user } = useAuth();

  return (
    <header className="p-4 flex justify-between items-center border-b bg-gray-50">
      <Link href="/">
        <span className="font-bold text-xl">Chatbot Platform</span>
      </Link>
      <nav>
        {user ? (
          <Link href="/dashboard">
            <Button variant="outline">Dashboard</Button>
          </Link>
        ) : (
          <Link href="/login">
            <Button variant="outline">Login</Button>
          </Link>
        )}
      </nav>
    </header>
  );
}
