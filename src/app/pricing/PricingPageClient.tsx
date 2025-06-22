'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import PricingPlans from '@/components/pricing/PricingPlans';
import { PricingHeader } from '@/components/pricing/PricingHeader';
import { PricingFAQ } from '@/components/pricing/PricingFAQ';

export default function PricingPageClient() {
  return (
    <>
      <PageHeader />
      <div className="min-h-screen bg-gradient-to-b from-background to-gray-50">
        {/* Unified Pricing Section */}
        <div className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <PricingHeader />
            </div>
            <PricingPlans />
          </div>
        </div>

        {/* FAQ Section */}
        <PricingFAQ />
      </div>
    </>
  );
}
