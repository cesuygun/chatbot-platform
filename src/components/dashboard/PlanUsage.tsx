'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSubscription } from '@/hooks/useSubscription';

export const PlanUsage = () => {
  const { subscription, chatbots, subscriptionLoading } = useSubscription();

  if (subscriptionLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Plan Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
            <div className="h-2.5 bg-gray-200 rounded-full w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxChatbots = subscription?.plan?.chatbot_limit ?? 5; // Default to 5 for free plan
  const usagePercentage = (chatbots.length / maxChatbots) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Plan Usage</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-2">
          You have used {chatbots.length} of your {maxChatbots} available chatbots.
        </p>
        <div className="w-full bg-muted rounded-full h-2.5">
          <div
            className="bg-primary h-2.5 rounded-full"
            style={{ width: `${usagePercentage}%` }}
          ></div>
        </div>
      </CardContent>
    </Card>
  );
};
