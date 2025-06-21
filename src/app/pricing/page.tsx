'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { useRouter } from 'next/navigation';

// Types
type BillingInterval = 'monthly' | 'yearly';
type FeatureSet = {
  'Customizable Interface': boolean;
  'GPT-4 Support': boolean;
  'Conversation History': string;
  'API Access': boolean;
  'Priority Support': boolean;
};

type Plan = {
  name: string;
  planId: {
    monthly: string;
    yearly: string;
  };
  price: {
    monthly: number;
    yearly: number;
  };
  features: FeatureSet;
  cta: string;
};

// Data
const plans: Plan[] = [
  {
    name: 'Free',
    planId: { monthly: 'price_free_m', yearly: 'price_free_y' },
    price: { monthly: 0, yearly: 0 },
    features: {
      'Customizable Interface': true,
      'GPT-4 Support': false,
      'Conversation History': '30 days',
      'API Access': false,
      'Priority Support': false,
    },
    cta: 'Get Started',
  },
  {
    name: 'Pro',
    planId: { monthly: 'price_pro_m', yearly: 'price_pro_y' },
    price: { monthly: 20, yearly: 200 },
    features: {
      'Customizable Interface': true,
      'GPT-4 Support': true,
      'Conversation History': 'Unlimited',
      'API Access': true,
      'Priority Support': false,
    },
    cta: 'Upgrade',
  },
  {
    name: 'Enterprise',
    planId: { monthly: 'enterprise', yearly: 'enterprise_yearly' },
    price: { monthly: 100, yearly: 1000 },
    features: {
      'Customizable Interface': true,
      'GPT-4 Support': true,
      'Conversation History': 'Unlimited',
      'API Access': true,
      'Priority Support': true,
    },
    cta: 'Contact Us',
  },
];

const allFeatures = Object.keys(plans[0].features);

export default function PricingPageClient() {
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  const handleCheckout = async (plan: Plan) => {
    if (!user) {
      router.push('/login?redirect=/pricing');
      return;
    }

    setLoadingPlan(plan.planId[billingInterval]);
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: plan.planId[billingInterval],
          userId: user.id,
        }),
      });

      const { url } = await response.json();
      if (url) {
        router.push(url);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleContactUs = () => {
    // Redirect to a contact form or show a modal
    alert('Please contact our sales team for enterprise pricing.');
  };

  return (
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
      <div className="py-20 bg-gray-50">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl font-extrabold mb-4">Choose Your Plan</h1>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Start for free, and scale up as you grow. No hidden fees.
          </p>

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

          <div className="overflow-x-auto">
            <table className="w-full max-w-5xl mx-auto bg-white shadow-lg rounded-lg">
              <thead>
                <tr className="border-b">
                  <th className="py-6 px-6 text-left text-lg font-bold">Features</th>
                  {plans.map(plan => (
                    <th key={plan.name} className="py-6 px-6 text-center">
                      <h2 className="text-2xl font-bold">{plan.name}</h2>
                      <p className="text-3xl font-bold mt-2">
                        €{plan.price[billingInterval]}
                        <span className="text-lg font-normal">/mo</span>
                      </p>
                      {billingInterval === 'yearly' && plan.price.yearly > 0 && (
                        <p className="text-sm text-gray-500">Billed annually</p>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allFeatures.map(feature => (
                  <tr key={feature} className="border-b last:border-b-0">
                    <td className="py-4 px-6 font-medium text-gray-700">{feature}</td>
                    {plans.map(plan => (
                      <td key={`${plan.name}-${feature}`} className="py-4 px-6 text-center">
                        {(() => {
                          const value = plan.features[feature as keyof FeatureSet];
                          if (typeof value === 'boolean') {
                            return value ? (
                              <Check className="h-6 w-6 text-green-500 mx-auto" />
                            ) : (
                              <X className="h-6 w-6 text-red-500 mx-auto" />
                            );
                          }
                          return <span className="text-gray-800">{value}</span>;
                        })()}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50">
                  <td></td>
                  {plans.map(plan => (
                    <td key={plan.name} className="p-6 text-center">
                      {plan.name === 'Enterprise' ? (
                        <Button className="w-full" size="lg" onClick={handleContactUs}>
                          {plan.cta}
                        </Button>
                      ) : plan.price.monthly === 0 ? (
                        <Link href="/register">
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
                          {loadingPlan === plan.planId[billingInterval]
                            ? 'Processing...'
                            : plan.cta}
                        </Button>
                      )}
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
