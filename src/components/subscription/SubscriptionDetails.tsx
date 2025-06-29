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
import { LoadingSpinner } from '../ui/LoadingSpinner';

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
  const [cancelLoading, setCancelLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeSuccess, setResumeSuccess] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) return;

      try {
        const response = await fetch('/api/stripe/subscription', {
          credentials: 'include',
        });
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

    setCancelLoading(true);
    setError(null);
    setCancelSuccess(false);

    try {
      const res = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ subscriptionId: subscription.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to cancel subscription');
      }

      // Refresh subscription data to show updated status
      const refreshRes = await fetch('/api/stripe/subscription', {
        credentials: 'include',
      });
      const refreshData = await refreshRes.json();

      if (refreshData.subscription) {
        setSubscription(refreshData.subscription);
      }
      setCancelSuccess(true);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel subscription';
      setError(errorMessage);
      setCancelSuccess(false);
      console.error('Cancel subscription error:', err);
    } finally {
      setCancelLoading(false);
    }
  };

  const handleOpenPortal = async () => {
    setPortalLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create customer portal session');
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No portal URL received');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to open customer portal';
      setError(errorMessage);
      console.error('Customer portal error:', err);
    } finally {
      setPortalLoading(false);
    }
  };

  const handleResumeSubscription = async () => {
    if (!subscription) return;
    setResumeLoading(true);
    setError(null);
    setResumeSuccess(false);
    try {
      const res = await fetch('/api/stripe/resume-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ subscriptionId: subscription.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to resume subscription');
      }
      // Refresh subscription data
      const refreshRes = await fetch('/api/stripe/subscription', {
        credentials: 'include',
      });
      const refreshData = await refreshRes.json();
      if (refreshData.subscription) {
        setSubscription(refreshData.subscription);
      }
      setResumeSuccess(true);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resume subscription';
      setError(errorMessage);
      setResumeSuccess(false);
    } finally {
      setResumeLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error && !subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Error Loading Subscription</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Active Subscription</CardTitle>
          <CardDescription>Subscribe to a plan to unlock all features</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Format amount in EUR
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <span className="text-lg font-semibold">
              {subscription.plan.name} - {subscription.plan.interval}
            </span>
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
              {formatAmount(subscription.plan.amount)}/{subscription.plan.interval}
            </p>
          </div>
          {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">{error}</div>}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {subscription.cancel_at_period_end ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              Your subscription will end on{' '}
              {new Date(subscription.current_period_end).toLocaleDateString()}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={handleResumeSubscription}
              disabled={resumeLoading || resumeSuccess}
            >
              {resumeLoading ? (
                <>
                  <LoadingSpinner className="w-4 h-4 mr-2" />
                  Resuming...
                </>
              ) : resumeSuccess ? (
                'Resumed!'
              ) : (
                'Resume Subscription'
              )}
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={handleCancelSubscription}
            disabled={cancelLoading || cancelSuccess}
          >
            {cancelLoading ? (
              <>
                <LoadingSpinner className="w-4 h-4 mr-2" />
                Cancelling...
              </>
            ) : cancelSuccess ? (
              'Cancellation Requested'
            ) : (
              'Cancel Subscription'
            )}
          </Button>
        )}
        <Button onClick={() => (window.location.href = '/pricing')}>Change Plan</Button>
      </CardFooter>
      {resumeSuccess && (
        <div className="text-green-600 text-sm bg-green-50 p-3 rounded-md mt-2">
          Your subscription has been resumed and will continue as normal.
        </div>
      )}
      {cancelSuccess && (
        <div className="text-green-600 text-sm bg-green-50 p-3 rounded-md mt-2">
          Your subscription will be cancelled at the end of the billing period.
        </div>
      )}
      {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md mt-2">{error}</div>}
    </Card>
  );
}
