'use client';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SubscriptionDetails } from '@/components/subscription/SubscriptionDetails';
import { SubscriptionHistory } from '@/components/subscription/SubscriptionHistory';
import { useSubscription } from '@/hooks/useSubscription';
import { Check, ExternalLink } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const SubscriptionPageClient = () => {
  const { subscription } = useSubscription();

  const handleManageSubscription = () => {
    window.open('/pricing', '_blank');
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
            <Suspense fallback={<LoadingSpinner />}>
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
            <Suspense fallback={<LoadingSpinner />}>
              <SubscriptionHistory />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SubscriptionPageClient;
