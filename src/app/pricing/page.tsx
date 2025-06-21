'use client';

import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { useRouter } from 'next/navigation';

const plans = [
  {
    name: 'Free',
    price: '$0',
    features: [
      '1 Chatbot',
      '100 Messages/Month',
      'Basic Knowledge Base',
      '1 Document Upload (5 pages)',
    ],
    cta: 'Start for Free',
    isCurrent: false,
    planId: { monthly: null, yearly: null },
  },
  {
    name: 'Pro',
    price: '$29',
    features: [
      '5 Chatbots',
      '2,000 Messages/Month',
      'Full Knowledge Base',
      'Unlimited Document Uploads',
      'Website Scraping',
      'Custom Branding',
      'Email Support',
    ],
    cta: 'Upgrade to Pro',
    isCurrent: false,
    planId: { monthly: 'pro_monthly', yearly: 'pro_yearly' },
  },
  {
    name: 'Enterprise',
    price: '$99',
    features: [
      'Unlimited Chatbots',
      '10,000+ Messages/Month',
      'Advanced Knowledge Base',
      'API Access',
      'Dedicated Support',
      'White-label Option',
    ],
    cta: 'Contact Us',
    isCurrent: false,
    planId: { monthly: 'enterprise_monthly', yearly: 'enterprise_yearly' },
  },
];

export default function PricingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleCheckout = async (plan: (typeof plans)[0]) => {
    if (!user) {
      router.push('/login?redirect=/pricing');
      return;
    }

    const planId = plan.planId[billingInterval];
    if (!planId) return;

    setLoadingPlan(planId);

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId, userId: user.id }),
      });

      const { url, error } = await response.json();

      if (error) {
        alert(`Error: ${error}`);
        return;
      }

      if (url) {
        router.push(url);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="py-20">
      <div className="container mx-auto text-center">
        <h1 className="text-5xl font-extrabold mb-4">Choose Your Plan</h1>
        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
          Start for free, and scale up as you grow. No hidden fees.
        </p>

        {/* Billing Interval Toggle */}
        <div className="inline-flex bg-gray-200 p-1 rounded-full mb-12">
          <Button
            variant={billingInterval === 'monthly' ? 'default' : 'ghost'}
            onClick={() => setBillingInterval('monthly')}
            className="rounded-full"
          >
            Monthly
          </Button>
          <Button
            variant={billingInterval === 'yearly' ? 'default' : 'ghost'}
            onClick={() => setBillingInterval('yearly')}
            className="rounded-full"
          >
            Yearly (Save 20%)
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map(plan => (
            <div
              key={plan.name}
              className={`border rounded-lg p-8 flex flex-col ${
                plan.name === 'Pro' ? 'border-blue-500 shadow-xl' : 'border-gray-300'
              }`}
            >
              <h2 className="text-2xl font-bold mb-4">{plan.name}</h2>
              <p className="text-4xl font-bold mb-6">
                {plan.price}
                <span className="text-lg font-normal">/month</span>
              </p>
              <ul className="text-left space-y-4 mb-8">
                {plan.features.map(feature => (
                  <li key={feature} className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="mt-auto">
                {plan.name === 'Enterprise' ? (
                  <Link href="/contact-sales">
                    <Button className="w-full" size="lg">
                      {plan.cta}
                    </Button>
                  </Link>
                ) : (
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => handleCheckout(plan)}
                    disabled={loadingPlan === plan.planId[billingInterval]}
                  >
                    {loadingPlan === plan.planId[billingInterval] ? 'Processing...' : plan.cta}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
