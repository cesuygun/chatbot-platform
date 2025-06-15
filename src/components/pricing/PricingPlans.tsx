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
import { Check } from 'lucide-react';
import { useAuth } from '@/contexts/auth/AuthContext';

const PRICING_PLANS = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for trying out our platform',
    price: 0,
    features: [
      {
        id: 'free-1',
        name: '1 Chatbot',
        description: 'Create and manage one chatbot',
        included: true,
      },
      {
        id: 'free-2',
        name: '100 Messages/Month',
        description: 'Limited message volume',
        included: true,
      },
      {
        id: 'free-3',
        name: 'Basic Templates',
        description: 'Access to basic chatbot templates',
        included: true,
      },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For growing businesses',
    price: 29,
    features: [
      {
        id: 'pro-1',
        name: '5 Chatbots',
        description: 'Create and manage multiple chatbots',
        included: true,
      },
      {
        id: 'pro-2',
        name: 'Unlimited Messages',
        description: 'No message volume restrictions',
        included: true,
      },
      {
        id: 'pro-3',
        name: 'Advanced Templates',
        description: 'Access to all chatbot templates',
        included: true,
      },
      {
        id: 'pro-4',
        name: 'Priority Support',
        description: 'Get help when you need it',
        included: true,
      },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations',
    price: 99,
    features: [
      {
        id: 'enterprise-1',
        name: 'Unlimited Chatbots',
        description: 'Create as many chatbots as you need',
        included: true,
      },
      {
        id: 'enterprise-2',
        name: 'Unlimited Messages',
        description: 'No message volume restrictions',
        included: true,
      },
      {
        id: 'enterprise-3',
        name: 'Custom Templates',
        description: 'Create and use custom templates',
        included: true,
      },
      {
        id: 'enterprise-4',
        name: '24/7 Support',
        description: 'Round-the-clock technical support',
        included: true,
      },
      {
        id: 'enterprise-5',
        name: 'Custom Integration',
        description: 'Integrate with your existing systems',
        included: true,
      },
    ],
  },
];

export function PricingPlans() {
  const [interval, setInterval] = useState<'month' | 'year'>('month');
  const router = useRouter();
  const { user } = useAuth();

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      router.push('/login?redirectTo=/pricing');
      return;
    }

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          interval,
          userId: user.id,
        }),
      });

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
    }
  };

  return (
    <div className="mt-16">
      <div className="flex justify-center gap-4 mb-8">
        <Button
          variant={interval === 'month' ? 'default' : 'outline'}
          onClick={() => setInterval('month')}
        >
          Monthly
        </Button>
        <Button
          variant={interval === 'year' ? 'default' : 'outline'}
          onClick={() => setInterval('year')}
        >
          Yearly
          <span className="ml-2 text-sm text-green-500">Save 20%</span>
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {PRICING_PLANS.map(plan => (
          <Card
            key={plan.id}
            className={`flex flex-col ${plan.id === 'pro' ? 'border-primary shadow-lg' : ''}`}
          >
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">${plan.price === 0 ? '0' : plan.price}</span>
                <span className="text-muted-foreground">/{interval}</span>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-4">
                {plan.features.map(feature => (
                  <li key={feature.id} className="flex items-start gap-3">
                    <Check
                      className={`h-5 w-5 flex-shrink-0 ${
                        feature.included ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    />
                    <div>
                      <p className="font-medium">{feature.name}</p>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                variant={plan.id === 'pro' ? 'default' : 'outline'}
                onClick={() => {
                  if (plan.id === 'enterprise') {
                    window.location.href = 'mailto:sales@example.com';
                  } else {
                    handleSubscribe(plan.id);
                  }
                }}
              >
                {plan.id === 'free' && 'Get Started'}
                {plan.id === 'pro' && 'Start Free Trial'}
                {plan.id === 'enterprise' && 'Contact Sales'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
