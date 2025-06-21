'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, MessageSquare, Star, Clock } from 'lucide-react';
import { Chatbot } from '@/types/chatbot';

interface DashboardChatbot extends Chatbot {
  messages: number;
  avg_rating: number;
  last_updated: string;
}

export default function DashboardPage() {
  const recentChatbots: DashboardChatbot[] = [
    {
      id: '1',
      user_id: '1',
      name: 'Support Bot',
      created_at: new Date().toISOString(),
      ai_model: 'gpt-4',
      messages: 150,
      avg_rating: 4.8,
      last_updated: '5m ago',
    },
    {
      id: '2',
      user_id: '1',
      name: 'Sales Assistant',
      created_at: new Date().toISOString(),
      ai_model: 'gpt-4',
      messages: 88,
      avg_rating: 4.9,
      last_updated: '1h ago',
    },
  ];

  return (
    <div className="p-8 bg-gray-50 min-h-full">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Link href="/dashboard/chatbots/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Create New
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">My Chatbots</h2>
        {recentChatbots.length === 0 ? (
          <p>You haven&apos;t created any chatbots yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recentChatbots.map(chatbot => (
              <Card
                key={chatbot.id}
                className="bg-white hover:shadow-xl transition-shadow flex flex-col"
              >
                <CardHeader>
                  <CardTitle className="text-xl">{chatbot.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow space-y-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <MessageSquare className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{chatbot.messages} Messages</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Star className="h-4 w-4 mr-2 text-gray-400" />
                    <span>Avg. Rating: {chatbot.avg_rating}/5</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2 text-gray-400" />
                    <span>Last Updated: {chatbot.last_updated}</span>
                  </div>
                </CardContent>
                <div className="p-6 pt-0 mt-auto flex space-x-2">
                  <Link href={`/dashboard/chatbots/${chatbot.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      Edit
                    </Button>
                  </Link>
                  <Link href={`/chat/${chatbot.id}`} target="_blank" className="flex-1">
                    <Button className="w-full">Deploy</Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle>Plan Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-2">
              You have used {recentChatbots.length} of your 5 available chatbots.
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${(recentChatbots.length / 5) * 100}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
