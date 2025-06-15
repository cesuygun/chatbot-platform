import { PricingPlan } from '@/types/pricing';

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for trying out our platform',
    price: 0,
    interval: 'month',
    features: [
      {
        id: 'messages-1000',
        name: '1,000 messages per month',
        description: 'Limited to 1,000 messages per month',
        included: true,
      },
      {
        id: 'chatbots-1',
        name: '1 chatbot',
        description: 'Create and manage one chatbot',
        included: true,
      },
      {
        id: 'team-1',
        name: '1 team member',
        description: 'Single user access',
        included: true,
      },
      {
        id: 'custom-domain-0',
        name: 'Custom domain',
        description: 'Use your own domain',
        included: false,
      },
      {
        id: 'analytics-basic',
        name: 'Basic analytics',
        description: 'View basic usage statistics',
        included: true,
      },
    ],
    limits: {
      messagesPerMonth: 1000,
      chatbots: 1,
      teamMembers: 1,
      customDomains: 0,
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For growing businesses',
    price: 49,
    interval: 'month',
    features: [
      {
        id: 'messages-10000',
        name: '10,000 messages per month',
        description: 'Up to 10,000 messages per month',
        included: true,
      },
      {
        id: 'chatbots-5',
        name: '5 chatbots',
        description: 'Create and manage up to 5 chatbots',
        included: true,
      },
      {
        id: 'team-5',
        name: '5 team members',
        description: 'Add up to 5 team members',
        included: true,
      },
      {
        id: 'custom-domain-1',
        name: '1 custom domain',
        description: 'Use your own domain',
        included: true,
      },
      {
        id: 'analytics-advanced',
        name: 'Advanced analytics',
        description: 'Detailed usage and performance metrics',
        included: true,
      },
    ],
    limits: {
      messagesPerMonth: 10000,
      chatbots: 5,
      teamMembers: 5,
      customDomains: 1,
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations',
    price: 199,
    interval: 'month',
    features: [
      {
        id: 'messages-unlimited',
        name: 'Unlimited messages',
        description: 'No message limit',
        included: true,
      },
      {
        id: 'chatbots-unlimited',
        name: 'Unlimited chatbots',
        description: 'Create as many chatbots as you need',
        included: true,
      },
      {
        id: 'team-unlimited',
        name: 'Unlimited team members',
        description: 'Add as many team members as needed',
        included: true,
      },
      {
        id: 'custom-domain-unlimited',
        name: 'Unlimited custom domains',
        description: 'Use multiple custom domains',
        included: true,
      },
      {
        id: 'analytics-enterprise',
        name: 'Enterprise analytics',
        description: 'Advanced analytics with custom reports',
        included: true,
      },
    ],
    limits: {
      messagesPerMonth: Infinity,
      chatbots: Infinity,
      teamMembers: Infinity,
      customDomains: Infinity,
    },
  },
];
