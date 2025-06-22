'use client';
import { ChatbotForm } from '@/components/chatbot/ChatbotForm';

export default function CreateChatbotPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Create New Chatbot</h1>
        <ChatbotForm />
      </div>
    </div>
  );
}
