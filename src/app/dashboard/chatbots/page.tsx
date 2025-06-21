'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Edit,
  Trash2,
  MessageSquare,
  Eye,
  MoreVertical,
  Calendar,
  Users,
  Star,
  Clock,
  BarChart2,
} from 'lucide-react';
import Link from 'next/link';

interface Chatbot {
  id: string;
  name: string;
  created_at: string;
  // Mock data to match the new design
  messages: number;
  avg_rating: number;
  last_updated: string;
}

export default function ChatbotsPage() {
  const router = useRouter();
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChatbots();
  }, []);

  const fetchChatbots = async () => {
    try {
      const response = await fetch('/api/chatbots', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        // Add mock data to the response
        const botsWithMockData = data.map((bot: any) => ({
          ...bot,
          messages: Math.floor(Math.random() * 2000) + 500,
          avg_rating: (Math.random() * 1.5 + 3.5).toFixed(1),
          last_updated: `${Math.floor(Math.random() * 7) + 1} days ago`,
        }));
        setChatbots(botsWithMockData);
      } else {
        console.error('Failed to fetch chatbots');
        setChatbots([]); // Set to empty array on failure
      }
    } catch (error) {
      console.error('Error fetching chatbots:', error);
      setChatbots([]); // Set to empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (chatbotId: string) => {
    if (!confirm('Are you sure you want to delete this chatbot? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/chatbots/${chatbotId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setChatbots(prev => prev.filter(bot => bot.id !== chatbotId));
      } else {
        alert('Failed to delete chatbot');
      }
    } catch (error) {
      console.error('Error deleting chatbot:', error);
      alert('An error occurred while deleting the chatbot');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-56 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-full">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Chatbots</h1>
          <Link href="/dashboard/chatbots/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create New
            </Button>
          </Link>
        </div>

        {chatbots.length === 0 ? (
          <Card>
            <CardContent className="text-center py-16">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No chatbots yet</h3>
              <p className="text-gray-600 mb-6">
                Create your first chatbot to get started with customer support automation.
              </p>
              <Link href="/dashboard/chatbots/create">
                <Button size="lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Chatbot
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {chatbots.map(chatbot => (
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

        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle>Plan Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-2">
                You have used {chatbots.length} of your 5 available chatbots.
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${(chatbots.length / 5) * 100}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
