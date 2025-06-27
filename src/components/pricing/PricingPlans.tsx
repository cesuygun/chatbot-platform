import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Minus } from 'lucide-react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useState, useEffect } from 'react';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useRouter } from 'next/navigation';

export const PricingPlans = () => {
  const { user } = useAuth();
  const { subscription, subscriptionLoading } = useSubscription();
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  const [plans, setPlans] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    fetch('/api/pricing')
      .then(res => res.json())
      .then(data => {
        setPlans(data.plans);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (subscriptionLoading || loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (!plans) {
    return <div className="text-center text-red-500">Failed to load pricing.</div>;
  }

  // Get all plan keys in display order
  const planOrder = ['free', 'pro', 'enterprise'];
  const planList = planOrder.map(key => plans[key]).filter(Boolean);

  // Build superset of all features
  const allFeatures = Array.from(
    new Set(planList.flatMap(plan => plan.features || []))
  );

  // Helper to get price string
  const getPriceString = (plan: any) => {
    const price = plan.prices[billingInterval];
    if (!price) return 'N/A';
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: price.currency.toUpperCase(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price.amount / 100);
    return `${formatted}${billingInterval === 'year' ? '/yr' : '/mo'}`;
  };

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
      <div className={`grid gap-8 ${planList.length === 1 ? 'md:grid-cols-1' : planList.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
        {planList.map(plan => (
          <Card key={plan.name} className="flex flex-col h-full">
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="mt-4">
                <span className="text-4xl font-bold">{getPriceString(plan)}</span>
              </div>
              <ul className="mt-6 space-y-4">
                {plan.features && plan.features.map((feature: string) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <div className="p-6 mt-auto">
              {subscription?.plan?.id === plan.name.toLowerCase() ? (
                <Button disabled className="w-full">
                  Current Plan
                </Button>
              ) : (
                <Button onClick={() => router.push('/register')} className="w-full">
                  {plan.name === 'Free' ? 'Get Started' : `Upgrade to ${plan.name}`}
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
      <div className="mt-16 overflow-x-auto">
        <h3 className="text-xl font-semibold mb-4 text-center">Compare all features</h3>
        <table className="min-w-full border rounded-lg bg-white mx-auto">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left border-b bg-gray-50 sticky left-0 z-10">Feature</th>
              {planList.map(plan => (
                <th key={plan.name} className="px-4 py-2 text-center border-b">{plan.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allFeatures.map(featureName => (
              <tr key={featureName}>
                <td className="px-4 py-2 border-b whitespace-nowrap bg-gray-50 sticky left-0 z-10">{featureName}</td>
                {planList.map(plan => {
                  const included = plan.features?.includes(featureName);
                  return (
                    <td key={plan.name} className="px-4 py-2 text-center border-b align-middle">
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
