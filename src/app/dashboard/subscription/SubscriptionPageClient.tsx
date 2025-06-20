'use client';
import { Suspense } from 'react';
import { SubscriptionDetails } from '@/components/subscription/SubscriptionDetails';
import { SubscriptionHistory } from '@/components/subscription/SubscriptionHistory';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const SubscriptionPageClient = () => (
  <div className="container mx-auto px-4 py-8">
    <h1 className="text-3xl font-bold mb-8">Subscription Management</h1>
    <div className="grid gap-8">
      <Suspense fallback={<div>Loading subscription details...</div>}>
        <SubscriptionDetails />
      </Suspense>
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

export default SubscriptionPageClient;
