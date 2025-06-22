import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useState } from 'react';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useRouter } from 'next/navigation';

const tiers = [
  {
    name: 'Free',
    id: 'free',
    href: '#',
    price: { monthly: '€0', annually: '€0' },
    description: 'Get started with the basics.',
    features: ['1 Chatbot', '50 Messages/mo', 'Basic Analytics', 'Community Support'],
    buttonText: 'Get Started',
  },
  {
    name: 'Pro',
    id: 'pro',
    href: '#',
    price: { monthly: '€15', annually: '€144' },
    description: 'For growing businesses and power users.',
    features: [
      '10 Chatbots',
      '2,000 Messages/mo',
      'Advanced Analytics',
      'Email Support',
      'Remove Branding',
    ],
    buttonText: 'Upgrade to Pro',
  },
];

const getPrice = (plan: (typeof tiers)[0], interval: 'monthly' | 'annually') => {
  return plan.price[interval];
};

export const PricingPlans = () => {
  const { user } = useAuth();
  const { subscription, subscriptionLoading } = useSubscription();
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annually'>('monthly');
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

  return (
    <div className="space-y-8">
      <div className="flex justify-center gap-4">
        <Button
          variant={billingInterval === 'monthly' ? 'default' : 'outline'}
          onClick={() => setBillingInterval('monthly')}
        >
          Monthly
        </Button>
        <Button
          variant={billingInterval === 'annually' ? 'default' : 'outline'}
          onClick={() => setBillingInterval('annually')}
        >
          Annually (20% off)
        </Button>
      </div>
      <div className="grid md:grid-cols-2 gap-8">
        {tiers.map(tier => (
          <Card key={tier.id} className="flex flex-col">
            <CardHeader>
              <CardTitle>{tier.name}</CardTitle>
              <CardDescription>{tier.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="mt-4">
                <span className="text-4xl font-bold">{getPrice(tier, billingInterval)}</span>
                <span className="text-muted-foreground">
                  /{billingInterval === 'monthly' ? 'mo' : 'yr'}
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
    </div>
  );
};
