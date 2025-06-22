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
        {/* Hero Section */}
        <div className="py-20 bg-background">
          <div className="container mx-auto px-4 text-center">
            <PricingHeader />
          </div>
        </div>

        {/* Pricing Plans Section */}
        <div className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <PricingPlans />
          </div>
        </div>

        {/* FAQ Section */}
        <PricingFAQ />
      </div>
    </>
  );
}
