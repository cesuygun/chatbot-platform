'use client';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, MessageSquare, Clock } from 'lucide-react';
import Link from 'next/link';
import { PlanUsage } from '@/components/dashboard/PlanUsage';

export default function DashboardPage() {
  const { subscription, chatbots, subscriptionLoading } = useSubscription();

  const chatbotLimit = subscription?.plan?.chatbot_limit || 0;
  const canCreateChatbot = chatbots.length < chatbotLimit;
  const recentChatbots = chatbots.slice(0, 2);

  return (
    <TooltipProvider>
      <div className="p-8 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={!canCreateChatbot ? 'cursor-not-allowed' : ''}
                  style={{ display: 'inline-block' }}
                >
                  <Link
                    href={canCreateChatbot ? '/dashboard/chatbots/create' : '#'}
                    passHref
                    legacyBehavior
                  >
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

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Recent Chatbots</h2>
            {subscriptionLoading ? (
              <p>Loading chatbots...</p>
            ) : recentChatbots.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {recentChatbots.map(bot => (
                  <Card key={bot.id} className="bg-white hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-xl">{bot.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <MessageSquare className="h-4 w-4 mr-2 text-gray-400" />
                        <span>
                          {/* TODO: Replace with real message count */}
                          {Math.floor(Math.random() * 2000) + 500} Messages
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-2 text-gray-400" />
                        <span>Created: {new Date(bot.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex space-x-2 mt-4">
                        <Link href={`/dashboard/chatbots/${bot.id}`} className="w-full" legacyBehavior>
                          <Button variant="outline" className="w-full">
                            Edit
                          </Button>
                        </Link>
                        <Link
                          href={`/dashboard/chatbots/${bot.id}/deploy`}
                          className="w-full"
                          legacyBehavior>
                          <Button className="w-full">Deploy</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p>You haven&apos;t created any chatbots yet.</p>
            )}
          </div>
          <PlanUsage />
        </div>
      </div>
    </TooltipProvider>
  );
}
