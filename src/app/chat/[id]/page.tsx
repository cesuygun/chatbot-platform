'use client';

import { ChatInterface } from '@/components/chatbot/ChatInterface';
import { useParams } from 'next/navigation';

export default function ChatPage() {
  const params = useParams();
  const botId = Array.isArray(params.id) ? params.id[0] : params.id;

  if (!botId) {
    return <div>Loading...</div>;
  }

  return (
    <div className="h-screen bg-gray-50">
      <ChatInterface botId={botId as string} />
    </div>
  );
}
