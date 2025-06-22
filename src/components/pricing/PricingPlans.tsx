import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Check, X } from 'lucide-react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { PRICING_PLANS } from '@/config/pricing';
import { PricingPlan } from '@/types/pricing';
import { useSubscription } from '@/hooks/useSubscription';

const YEARLY_DISCOUNT = 0.2; // 20% off
const MONTHS_IN_YEAR = 12;

const getPrice = (plan: PricingPlan, interval: 'monthly' | 'yearly'): number => {
  if (interval === 'yearly') {
    if (plan.price === 0) return 0;
    return Math.round(plan.price * MONTHS_IN_YEAR * (1 - YEARLY_DISCOUNT));
  }
  return plan.price;
};

export default function PricingPlans() {
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly');
  const router = useRouter();
  const { user } = useAuth();
  const { subscription, loading: subscriptionLoading } = useSubscription();

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      router.push('/login?redirectTo=/pricing');
      return;
    }

    try {
      const plan = `${planId}_${interval}`;
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Something went wrong');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
    }
  };

  const isCurrentPlan = (plan: PricingPlan) => {
    // A logged out user never has a "current" plan.
    if (!user) {
      return false;
    }
    if (!subscription) {
      // If logged in and no subscription, the user is on the free plan by default
      return plan.id === 'free';
    }
    return subscription.plan.id === plan.id;
  };

  const getButtonLabel = (plan: PricingPlan): string => {
    if (subscriptionLoading) {
      return 'Loading...';
    }

    if (plan.id === 'enterprise') {
      return 'Contact Us';
    }

    if (!user) {
      return plan.id === 'free' ? 'Get Started' : 'Sign up';
    }

    // User is logged in
    if (isCurrentPlan(plan)) {
      return 'Current Plan';
    }

    if (plan.id === 'free') {
      // Cancellation should be handled in the subscription settings, not here.
      return '';
    }

    const currentPlan = PRICING_PLANS.find(p => p.id === subscription?.plan.id);

    if (!currentPlan || currentPlan.id === 'free') {
      return 'Upgrade';
    }

    if (plan.price > currentPlan.price) {
      return 'Upgrade';
    }

    if (plan.price < currentPlan.price) {
      return 'Downgrade';
    }

    return 'Change Plan'; // Fallback
  };

  const handleButtonClick = (plan: PricingPlan) => {
    if (plan.id === 'enterprise') {
      window.location.href = 'mailto:sales@example.com';
      return;
    }
    // For logged-out users
    if (!user) {
      if (plan.id === 'free') {
        router.push('/register');
      } else {
        router.push('/login?redirectTo=/pricing');
      }
      return;
    }

    // For logged-in users, this will only be called for paid plans.
    handleSubscribe(plan.id);
  };

  const isDisabled = (plan: PricingPlan) => {
    if (subscriptionLoading) {
      return true;
    }
    // A logged out user should always be able to click the buttons
    if (!user) {
      return false;
    }
    return isCurrentPlan(plan);
  };

  return (
    <div>
      <div className="flex justify-center gap-4 mb-8">
        <Button
          variant={interval === 'monthly' ? 'default' : 'outline'}
          onClick={() => setInterval('monthly')}
        >
          Monthly
        </Button>
        <Button
          variant={interval === 'yearly' ? 'default' : 'outline'}
          onClick={() => setInterval('yearly')}
        >
          Yearly
          <span className="ml-2 text-sm text-green-500">Save 20%</span>
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {PRICING_PLANS.map(plan => (
          <Card
            key={plan.id}
            className={`flex flex-col relative ${
              plan.id === 'pro' ? 'border-primary shadow-lg scale-105' : ''
            } ${isCurrentPlan(plan) ? 'ring-2 ring-primary' : ''}`}
            data-testid={plan.id === 'pro' ? 'pro-plan-card' : undefined}
          >
            {isCurrentPlan(plan) && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                  Current Plan
                </span>
              </div>
            )}
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">€{getPrice(plan, interval)}</span>
                <span className="text-muted-foreground">
                  /{interval === 'monthly' ? 'mo' : 'yr'}
                </span>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-4">
                {plan.features.map(feature => (
                  <li key={feature.id} className="flex items-start gap-3">
                    {feature.included ? (
                      <Check className="h-5 w-5 flex-shrink-0 text-primary" />
                    ) : (
                      <X className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                    )}
                    <div>
                      <p
                        className={`font-medium ${!feature.included ? 'text-muted-foreground' : ''}`}
                      >
                        {feature.name}
                      </p>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              {getButtonLabel(plan) && (
                <Button
                  className="w-full"
                  onClick={() => handleButtonClick(plan)}
                  disabled={isDisabled(plan)}
                  variant={plan.id === 'pro' ? 'default' : 'outline'}
                >
                  {getButtonLabel(plan)}
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
