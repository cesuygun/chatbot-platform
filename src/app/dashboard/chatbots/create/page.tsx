'use client';
import { ChatbotForm } from '@/components/chatbot/ChatbotForm';

export default function CreateChatbotPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Create New Chatbot</h1>
      <ChatbotForm />
    </div>
  );
}
