import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Minus } from 'lucide-react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useState } from 'react';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useRouter } from 'next/navigation';
import { PRICING_PLANS, CURRENCY_CONFIG } from '@/config/pricing';

// Build a superset of all features
const allFeatures = Array.from(
  new Set(
    PRICING_PLANS.flatMap(plan => plan.features.map(f => f.name))
  )
);

// Convert backend pricing to frontend display format
const getDisplayPrice = (price: number, interval: 'month' | 'year') => {
  const currency = CURRENCY_CONFIG.symbol;
  const adjustedPrice = Math.round(price * CURRENCY_CONFIG.exchangeRate);
  // Apply 20% discount for annual
  const annualPrice = interval === 'year' ? Math.round(adjustedPrice * 12 * 0.8) : adjustedPrice * 12;
  return {
    month: `${currency}${adjustedPrice}`,
    year: `${currency}${annualPrice}`
  };
};

// Convert backend plans to frontend tiers
const getTiers = () => {
  return PRICING_PLANS.map(plan => ({
    name: plan.name,
    id: plan.id,
    href: '#',
    description: plan.description,
    features: plan.features.filter(f => f.included).map(f => f.name),
    buttonText: plan.id === 'free' ? 'Get Started' : `Upgrade to ${plan.name}`,
    planPrice: plan.price,
  }));
};

const tiers = getTiers();

const getPrice = (plan: (typeof tiers)[0], interval: 'monthly' | 'annually') => {
  return plan.price[interval];
};

export const PricingPlans = () => {
  const { user } = useAuth();
  const { subscription, subscriptionLoading } = useSubscription();
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  const router = useRouter();

  if (subscriptionLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  const handleCheckout = async (planId: string) => {
    if (!user) {
      router.push('/register');
      return;
    }

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: `${planId}_${billingInterval}`,
          userId: user.id,
        }),
      });

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
    }
  };

  // Responsive grid based on plan count
  const gridCols = tiers.length === 1 ? 'md:grid-cols-1' : tiers.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3';

  return (
    <div className="space-y-8">
      <div className="flex justify-center gap-4">
        <Button
          variant={billingInterval === 'month' ? 'default' : 'outline'}
          onClick={() => setBillingInterval('month')}
        >
          Monthly
        </Button>
        <Button
          variant={billingInterval === 'year' ? 'default' : 'outline'}
          onClick={() => setBillingInterval('year')}
        >
          Annually (20% off)
        </Button>
      </div>
      <div className={`grid gap-8 ${gridCols}`}>
        {tiers.map(tier => (
          <Card key={tier.id} className="flex flex-col h-full">
            <CardHeader>
              <CardTitle>{tier.name}</CardTitle>
              <CardDescription>{tier.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="mt-4">
                <span className="text-4xl font-bold">{getDisplayPrice(tier.planPrice, billingInterval)[billingInterval]}</span>
                <span className="text-muted-foreground">
                  /{billingInterval === 'month' ? 'mo' : 'yr'}
                </span>
              </div>
              <ul className="mt-6 space-y-4">
                {tier.features.map(feature => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <div className="p-6 mt-auto">
              {subscription?.plan?.id === tier.id ? (
                <Button disabled className="w-full">
                  Current Plan
                </Button>
              ) : (
                <Button onClick={() => handleCheckout(tier.id)} className="w-full">
                  {tier.buttonText}
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
      <div className="mt-16 overflow-x-auto">
        <h3 className="text-xl font-semibold mb-4 text-center">Compare all features</h3>
        <table className="min-w-full border rounded-lg bg-white">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left border-b bg-gray-50 sticky left-0 z-10">Feature</th>
              {tiers.map(tier => (
                <th key={tier.id} className="px-4 py-2 text-center border-b">{tier.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from(new Set(PRICING_PLANS.flatMap(plan => plan.features.map(f => f.name)))).map(featureName => (
              <tr key={featureName}>
                <td className="px-4 py-2 border-b whitespace-nowrap bg-gray-50 sticky left-0 z-10">{featureName}</td>
                {tiers.map(tier => {
                  const plan = PRICING_PLANS.find(p => p.id === tier.id);
                  const included = plan?.features.find(f => f.name === featureName)?.included;
                  return (
                    <td key={tier.id} className="px-4 py-2 text-center border-b align-middle">
                      {included ? (
                        <Check className="inline h-5 w-5 text-green-500" />
                      ) : (
                        <Minus className="inline h-5 w-5 text-gray-300" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
