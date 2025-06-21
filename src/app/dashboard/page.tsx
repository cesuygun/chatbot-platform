'use client';
export const dynamic = 'force-dynamic';

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Bot {
  id: string;
  name: string;
  messages: number;
  avgRating: number;
  lastUpdated: string;
}

// Mock data for chatbots - this will be replaced with real data from Supabase
const mockChatbots: Bot[] = [
  { id: '1', name: 'Customer Support', messages: 1245, avgRating: 4.8, lastUpdated: '2 days ago' },
  { id: '2', name: 'Product FAQ', messages: 856, avgRating: 4.5, lastUpdated: '1 day ago' },
  { id: '3', name: 'Lead Generation', messages: 2310, avgRating: 4.2, lastUpdated: '5 days ago' },
  { id: '4', name: 'Sales Assistant', messages: 789, avgRating: 4.9, lastUpdated: '3 days ago' },
  { id: '5', name: 'Booking Agent', messages: 450, avgRating: 4.6, lastUpdated: '1 week ago' },
];

const PlanUsage = {
  current: 3,
  limit: 5,
};

export default function DashboardPage() {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Chatbots</h1>
        <Link href="/dashboard/chatbots/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Create New
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockChatbots.map(bot => (
          <div
            key={bot.id}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2">{bot.name}</h2>
            <p className="text-sm text-gray-600">Messages: {bot.messages}</p>
            <p className="text-sm text-gray-600">Avg. Rating: {bot.avgRating}/5</p>
            <p className="text-sm text-gray-500 mt-4">Last Updated: {bot.lastUpdated}</p>
            <div className="flex justify-end space-x-2 mt-4">
              <Link href={`/dashboard/chatbots/${bot.id}`}>
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </Link>
              <Button variant="default" size="sm">
                Deploy
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12">
        <h3 className="text-lg font-medium">Plan Usage</h3>
        <p className="text-sm text-gray-600 mb-2">
          You have used {PlanUsage.current} of your {PlanUsage.limit} available chatbots.
        </p>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full"
            style={{ width: `${(PlanUsage.current / PlanUsage.limit) * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
