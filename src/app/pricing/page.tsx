'use client';

import { Suspense } from 'react';
import { PricingHeader } from '../../components/pricing/PricingHeader';
import PricingPlans from '../../components/pricing/PricingPlans';
import { PricingFAQ } from '../../components/pricing/PricingFAQ';

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
