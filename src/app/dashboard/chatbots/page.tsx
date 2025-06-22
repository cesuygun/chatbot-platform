'use client';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, MessageSquare, Star, Clock } from 'lucide-react';
import Link from 'next/link';
import { PlanUsage } from '@/components/dashboard/PlanUsage';

export default function ChatbotsPage() {
  const { subscription, chatbots, subscriptionLoading } = useSubscription();

  const chatbotLimit = subscription?.plan?.chatbot_limit || 0;
  const canCreateChatbot = chatbots.length < chatbotLimit;

  if (subscriptionLoading) {
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
    <TooltipProvider>
      <div className="p-8 bg-gray-50 min-h-full">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">My Chatbots</h1>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={!canCreateChatbot ? 'cursor-not-allowed' : ''}
                  style={{ display: 'inline-block' }}
                >
                  <Link href={canCreateChatbot ? '/dashboard/chatbots/create' : '#'} passHref>
                    <Button disabled={!canCreateChatbot}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create New
                    </Button>
                  </Link>
                </div>
              </TooltipTrigger>
              {!canCreateChatbot && (
                <TooltipContent>
                  <p>You have reached your chatbot limit. Please upgrade your plan.</p>
                </TooltipContent>
              )}
            </Tooltip>
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
                      {/* TODO: Replace with real message count from usage_stats table */}
                      <span>{Math.floor(Math.random() * 2000) + 500} Messages</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Star className="h-4 w-4 mr-2 text-gray-400" />
                      {/* TODO: Replace with real rating */}
                      <span>
                        Avg. Rating: {parseFloat((Math.random() * 1.5 + 3.5).toFixed(1))}/5
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2 text-gray-400" />
                      <span>Last Updated: {new Date(chatbot.created_at).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                  <div className="p-6 pt-0 mt-auto flex space-x-2">
                    <Link href={`/dashboard/chatbots/${chatbot.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        Edit
                      </Button>
                    </Link>
                    <Link href={`/dashboard/chatbots/${chatbot.id}/deploy`} className="flex-1">
                      <Button className="w-full">Deploy</Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
          <div className="mt-12">
            <PlanUsage />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
