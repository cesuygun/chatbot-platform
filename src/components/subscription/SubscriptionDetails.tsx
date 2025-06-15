'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Subscription {
  id: string;
  status: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  plan: {
    name: string;
    interval: string;
    amount: number;
  };
}

export function SubscriptionDetails() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) return;

      try {
        const response = await fetch('/api/stripe/subscription');
        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        setSubscription(data.subscription);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load subscription');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [user]);

  const handleCancelSubscription = async () => {
    if (!subscription) return;

    try {
      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: subscription.id,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setSubscription({
        ...subscription,
        cancel_at_period_end: true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription');
    }
  };

  if (loading) {
    return <div>Loading subscription details...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Active Subscription</CardTitle>
          <CardDescription>Subscribe to a plan to unlock all features</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={() => (window.location.href = '/pricing')}>View Plans</Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>
              {subscription.plan.name} - {subscription.plan.interval}
            </CardDescription>
          </div>
          <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
            {subscription.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Next billing date</p>
            <p className="font-medium">
              {new Date(subscription.current_period_end).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Amount</p>
            <p className="font-medium">
              ${(subscription.plan.amount / 100).toFixed(2)}/{subscription.plan.interval}
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {subscription.cancel_at_period_end ? (
          <p className="text-sm text-muted-foreground">
            Your subscription will end on{' '}
            {new Date(subscription.current_period_end).toLocaleDateString()}
          </p>
        ) : (
          <Button variant="outline" onClick={handleCancelSubscription}>
            Cancel Subscription
          </Button>
        )}
        <Button onClick={() => (window.location.href = '/pricing')}>Change Plan</Button>
      </CardFooter>
    </Card>
  );
}
