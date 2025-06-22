'use client';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SubscriptionDetails } from '@/components/subscription/SubscriptionDetails';
import { SubscriptionHistory } from '@/components/subscription/SubscriptionHistory';
import { useSubscription } from '@/hooks/useSubscription';
import { useRouter } from 'next/navigation';
import { Check, ExternalLink } from 'lucide-react';

const SubscriptionPageClient = () => {
  const { subscription } = useSubscription();
  const router = useRouter();

  const handleManageSubscription = () => {
    router.push('/pricing');
  };

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

      if (response.ok) {
        // Refresh the page to show updated subscription status
        window.location.reload();
      } else {
        console.error('Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Subscription Management</h1>
        <p className="text-muted-foreground">Manage your subscription and billing information</p>
      </div>

      <div className="grid gap-8">
        {/* Current Subscription Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Current Plan
              {subscription && (
                <Badge variant="secondary">
                  {subscription.status === 'active' ? 'Active' : subscription.status}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Your current subscription details and usage</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div>Loading subscription details...</div>}>
              <SubscriptionDetails />
            </Suspense>
          </CardContent>
        </Card>

        {/* Subscription Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Manage Your Subscription</CardTitle>
            <CardDescription>Upgrade, downgrade, or cancel your subscription</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button onClick={handleManageSubscription} className="flex-1" variant="outline">
                <ExternalLink className="w-4 h-4 mr-2" />
                View All Plans
              </Button>

              {subscription && subscription.status === 'active' && (
                <Button onClick={handleCancelSubscription} variant="destructive" className="flex-1">
                  Cancel Subscription
                </Button>
              )}
            </div>

            <div className="text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                Changes take effect immediately
              </p>
              <p className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                No setup fees or hidden charges
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Billing History */}
        <Card>
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
            <CardDescription>View your past invoices and payment history</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div>Loading billing history...</div>}>
              <SubscriptionHistory />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SubscriptionPageClient;
