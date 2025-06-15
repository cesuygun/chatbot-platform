'use client';

import { Suspense } from 'react';
import { PricingHeader, PricingPlans, PricingFAQ } from '@/components/pricing';

export default function PricingPage() {
  return (
    <div className="container mx-auto py-12">
      <PricingHeader />
      <Suspense fallback={<div>Loading plans...</div>}>
        <PricingPlans />
      </Suspense>
      <PricingFAQ />
    </div>
  );
}
