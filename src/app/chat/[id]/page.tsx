'use client';

import { useParams } from 'next/navigation';
import { ChatInterface } from '@/components/chatbot/ChatInterface';
import { useAuth } from '@/contexts/auth/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function ChatPage() {
  const params = useParams();
  const chatbotId = params.id as string;
  const { loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return <ChatInterface botId={chatbotId} />;
}
