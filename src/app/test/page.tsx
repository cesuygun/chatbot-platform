'use client';

import { ChatbotWidget } from '@/components/chatbot/ChatbotWidget';

export default function TestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Chatbot Widget Test Page</h1>
        <p className="mb-8">Click the chat button in the bottom right to test the widget.</p>
        <ChatbotWidget botId="test-bot-id" className="fixed bottom-4 right-4" />
      </div>
    </div>
  );
}
