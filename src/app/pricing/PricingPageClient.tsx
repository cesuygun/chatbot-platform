'use client';
import { Suspense } from 'react';
import { PricingHeader } from '../../components/pricing/PricingHeader';
import PricingPlans from '../../components/pricing/PricingPlans';
import { PricingFAQ } from '../../components/pricing/PricingFAQ';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const PricingPageClient = () => (
  <>
    <header className="p-4 flex justify-between items-center border-b bg-gray-50">
      <Link href="/">
        <span className="font-bold text-xl">Chatbot Platform</span>
      </Link>
      <nav>
        <Link href="/login" passHref>
          <Button variant="outline">Login</Button>
        </Link>
      </nav>
    </header>
    <div className="container mx-auto py-12">
      <PricingHeader />
      <Suspense fallback={<div>Loading plans...</div>}>
        <PricingPlans />
      </Suspense>
      <PricingFAQ />
    </div>
  </>
);

export default PricingPageClient;
