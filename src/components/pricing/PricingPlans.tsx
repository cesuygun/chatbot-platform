import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Minus } from 'lucide-react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useState, useEffect } from 'react';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useRouter } from 'next/navigation';
import type { PricingPlan } from '@/types/pricing';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export const PricingPlans = () => {
  const { user } = useAuth();
  const { subscription, subscriptionLoading } = useSubscription();
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  const [plans, setPlans] = useState<Record<string, PricingPlan> | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgradeLoading, setUpgradeLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [showDowngradeModal, setShowDowngradeModal] = useState(false);
  const [pendingDowngradePlan, setPendingDowngradePlan] = useState<PricingPlan | null>(null);

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
  const planList = planOrder
    .map(key => {
      const plan = plans[key];
      if (!plan) return undefined;
      const priceObj = plan.prices?.[billingInterval];
      return {
        ...plan,
        interval: billingInterval,
        price: priceObj?.amount,
        currency: priceObj?.currency,
        priceId: priceObj?.id,
      } as PricingPlan & { interval: 'month' | 'year'; price?: number; currency?: string; priceId?: string };
    })
    .filter((plan): plan is PricingPlan & { interval: 'month' | 'year'; price?: number; currency?: string; priceId?: string } => !!plan);

  // Build superset of all features (as string[])
  const allFeatures: string[] = Array.from(
    new Set(planList.flatMap(plan =>
      Array.isArray(plan.features)
        ? plan.features.map(f => typeof f === 'string' ? f : f.name)
        : []
    ))
  );

  // Helper to get price string - always use EUR
  const getPriceString = (plan: PricingPlan) => {
    if (plan.prices) {
      const price = plan.prices[billingInterval];
      if (!price) return 'N/A';
      
      // Always format in EUR regardless of what's returned from API
      const formatted = new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(price.amount / 100);
      return `${formatted}${billingInterval === 'year' ? '/yr' : '/mo'}`;
    } else if (typeof plan.price === 'number') {
      const formatted = new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(plan.price);
      return `${formatted}${plan.interval === 'year' ? '/yr' : '/mo'}`;
    }
    return 'N/A';
  };

  // Enhanced button logic for SaaS
  const getButtonAction = (plan: PricingPlan) => {
    const planName = plan.name.toLowerCase();
    const currentPlanName = subscription?.plan?.name?.toLowerCase();
    const currentInterval = subscription?.plan?.interval;
    // The plan card's interval is plan.interval, the selected tab is billingInterval

    // If user is not logged in
    if (!user) {
      return {
        action: 'register',
        text: planName === 'free' ? 'Get Started' : `Upgrade to ${plan.name}`,
        disabled: false
      };
    }

    // If this is the user's current plan and interval, and matches the selected tab
    if (
      planName === currentPlanName &&
      plan.interval === currentInterval &&
      plan.interval === billingInterval
    ) {
      return { action: 'current', text: 'Current Plan', disabled: true };
    }

    // If this is the user's current plan but a different interval, and matches the selected tab
    if (
      planName === currentPlanName &&
      plan.interval !== currentInterval &&
      plan.interval === billingInterval
    ) {
      return {
        action: 'switch_cycle',
        text: plan.interval === 'year' ? 'Switch to Yearly' : 'Switch to Monthly',
        disabled: false
      };
    }

    // If user has no subscription and this is the free plan
    if (user && !subscription && planName === 'free') {
      return {
        action: 'dashboard',
        text: 'Go to Dashboard',
        disabled: false
      };
    }

    // If user has no subscription and this is a paid plan
    if (user && !subscription && planName !== 'free') {
      return {
        action: 'upgrade',
        text: `Upgrade to ${plan.name}`,
        disabled: false
      };
    }

    // Downgrade to Free
    if (subscription && planName === 'free') {
      return {
        action: 'downgrade_to_free',
        text: 'Downgrade to Free',
        disabled: false
      };
    }

    // Downgrade to lower paid plan
    if (subscription && planName !== 'free' && planOrder.indexOf(planName) < planOrder.indexOf(currentPlanName || '')) {
      return {
        action: 'downgrade',
        text: `Downgrade to ${plan.name}`,
        disabled: false
      };
    }

    // Upgrade
    if (subscription && planOrder.indexOf(planName) > planOrder.indexOf(currentPlanName || '')) {
      return {
        action: 'upgrade',
        text: `Upgrade to ${plan.name}`,
        disabled: false
      };
    }

    // Default
    return {
      action: 'upgrade',
      text: `Upgrade to ${plan.name}`,
      disabled: false
    };
  };

  // Enhanced handler for upgrade/downgrade/switch
  const handlePlanAction = async (plan: PricingPlan, action: string) => {
    setUpgradeLoading(plan.name.toLowerCase());
    setError(null);
    try {
      if (action === 'register') {
        router.push('/register');
        return;
      }
      if (action === 'dashboard') {
        router.push('/dashboard');
        return;
      }
      if (action === 'downgrade_to_free') {
        setPendingDowngradePlan(plan);
        setShowDowngradeModal(true);
        return;
      }
      // For upgrade/downgrade/switch, always use the interval from the toggle
      let planKey = '';
      if (plan.name.toLowerCase() === 'pro') {
        planKey = billingInterval === 'year' ? 'pro_yearly' : 'pro_monthly';
      } else if (plan.name.toLowerCase() === 'enterprise') {
        planKey = billingInterval === 'year' ? 'enterprise_yearly' : 'enterprise_monthly';
      } else if (plan.name.toLowerCase() === 'free') {
        planKey = 'free';
      }
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planKey }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
      // TODO: Show success toast/notification here
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to change plan';
      setError(errorMessage);
      // TODO: Show error toast/notification here
    } finally {
      setUpgradeLoading(null);
    }
  };

  // Handler for confirming downgrade to Free
  const confirmDowngradeToFree = async () => {
    if (!pendingDowngradePlan || !subscription) return;
    setUpgradeLoading('free');
    setShowDowngradeModal(false);
    setError(null);
    try {
      const res = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ subscriptionId: subscription.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to cancel subscription');
      }
      // TODO: Show success toast/notification here
      // Optionally refresh subscription state here
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel subscription';
      setError(errorMessage);
      // TODO: Show error toast/notification here
    } finally {
      setUpgradeLoading(null);
      setPendingDowngradePlan(null);
    }
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
      
      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md text-center">
          {error}
        </div>
      )}
      
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
                {plan.features && Array.isArray(plan.features) && plan.features.map((feature, idx) => {
                  if (typeof feature === 'string') {
                    return (
                      <li key={feature} className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-green-500" />
                        <span>{feature}</span>
                      </li>
                    );
                  } else {
                    return (
                      <li key={feature.id || idx} className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-green-500" />
                        <span>{feature.name}</span>
                      </li>
                    );
                  }
                })}
              </ul>
            </CardContent>
            <div className="p-6 mt-auto">
              {(() => {
                const buttonProps = getButtonAction(plan);
                const isLoading = !!upgradeLoading;
                return (
                  <Button
                    className={`w-full mt-6 ${buttonProps.disabled ? 'opacity-50 cursor-not-allowed bg-gray-200 text-gray-500 border-gray-300' : 'bg-black text-white hover:bg-gray-900 border-black'}`}
                    disabled={buttonProps.disabled || isLoading}
                    onClick={() => handlePlanAction(plan, buttonProps.action)}
                  >
                    {isLoading && upgradeLoading === plan.name.toLowerCase() ? (
                      <>
                        <LoadingSpinner className="w-4 h-4 mr-2" />
                        Processing...
                      </>
                    ) : (
                      buttonProps.text
                    )}
                  </Button>
                );
              })()}
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
                  let included = false;
                  if (Array.isArray(plan.features)) {
                    if (typeof plan.features[0] === 'string') {
                      included = (plan.features as string[]).includes(featureName);
                    } else {
                      included = (plan.features as { name: string }[]).some(f => f.name === featureName);
                    }
                  }
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
      {/* Downgrade to Free Modal */}
      <Dialog open={showDowngradeModal} onOpenChange={setShowDowngradeModal}>
        <DialogContent>
          <DialogTitle>Downgrade to Free Plan</DialogTitle>
          <DialogDescription>
            Are you sure you want to downgrade to the Free plan? You will lose access to paid features at the end of your billing period.
          </DialogDescription>
          <div className="flex gap-4 mt-6 justify-end">
            <Button variant="outline" onClick={() => setShowDowngradeModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDowngradeToFree} disabled={upgradeLoading === 'free'}>
              {upgradeLoading === 'free' ? <LoadingSpinner className="w-4 h-4 mr-2" /> : null}
              Confirm Downgrade
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
