import { PricingPlan } from '@/types/pricing';

// Currency configuration - can be made environment-specific
export const CURRENCY_CONFIG = {
  symbol: process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '€',
  code: process.env.NEXT_PUBLIC_CURRENCY_CODE || 'EUR',
  exchangeRate: process.env.NEXT_PUBLIC_EXCHANGE_RATE ? parseFloat(process.env.NEXT_PUBLIC_EXCHANGE_RATE) : 1,
};

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'For individuals and small projects',
    price: 0,
    interval: 'month',
    features: [
      {
        id: 'chatbots-1',
        name: '1 Chatbot',
        description: 'Number of chatbots you can create.',
        included: true,
      },
      {
        id: 'messages-100',
        name: '100 Monthly Messages',
        description: 'Number of messages per month.',
        included: true,
      },
      {
        id: 'knowledge-base-basic',
        name: 'Knowledge Base Integration (Basic)',
        description: 'Basic knowledge base integration.',
        included: true,
      },
      {
        id: 'pdf-upload-basic',
        name: 'PDF Document Upload (1 document, max 5 pages)',
        description: 'Upload PDF documents.',
        included: true,
      },
      {
        id: 'website-scraping',
        name: 'Website Scraping',
        description: 'Scrape websites for content.',
        included: false,
      },
      {
        id: 'custom-branding',
        name: 'Custom Branding',
        description: 'Customize the look and feel.',
        included: false,
      },
      {
        id: 'analytics-dashboard-basic',
        name: 'Analytics Dashboard (Basic)',
        description: 'Basic analytics dashboard.',
        included: true,
      },
      {
        id: 'multi-language-support-basic',
        name: 'Multi-language Support (3 languages)',
        description: 'Support for multiple languages.',
        included: true,
      },
      {
        id: 'api-access',
        name: 'API Access',
        description: 'Access to the API.',
        included: false,
      },
      {
        id: 'dedicated-support',
        name: 'Dedicated Support',
        description: 'Dedicated support.',
        included: false,
      },
      {
        id: 'white-label-option',
        name: 'White-label Option',
        description: 'White-label option.',
        included: false,
      },
    ],
    limits: {
      chatbots: 1,
      messagesPerMonth: 100,
      teamMembers: 1,
      customDomains: 0,
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For growing businesses',
    price: 29,
    interval: 'month',
    features: [
      {
        id: 'chatbots-5',
        name: '5 Chatbots',
        description: 'Number of chatbots you can create.',
        included: true,
      },
      {
        id: 'messages-2000',
        name: '2,000 Monthly Messages',
        description: 'Number of messages per month.',
        included: true,
      },
      {
        id: 'knowledge-base-advanced',
        name: 'Knowledge Base Integration',
        description: 'Advanced knowledge base integration.',
        included: true,
      },
      {
        id: 'pdf-upload-unlimited',
        name: 'PDF Document Upload (Unlimited documents)',
        description: 'Upload PDF documents.',
        included: true,
      },
      {
        id: 'website-scraping-5',
        name: 'Website Scraping (5 websites)',
        description: 'Scrape websites for content.',
        included: true,
      },
      {
        id: 'custom-branding-advanced',
        name: 'Custom Branding',
        description: 'Customize the look and feel.',
        included: true,
      },
      {
        id: 'analytics-dashboard-advanced',
        name: 'Analytics Dashboard',
        description: 'Advanced analytics dashboard.',
        included: true,
      },
      {
        id: 'multi-language-support-10',
        name: 'Multi-language Support (10 languages)',
        description: 'Support for multiple languages.',
        included: true,
      },
      {
        id: 'api-access-pro',
        name: 'API Access',
        description: 'Access to the API.',
        included: false,
      },
      {
        id: 'dedicated-support-email',
        name: 'Dedicated Support (Email)',
        description: 'Dedicated support.',
        included: true,
      },
      {
        id: 'white-label-option-pro',
        name: 'White-label Option',
        description: 'White-label option.',
        included: false,
      },
    ],
    limits: {
      chatbots: 5,
      messagesPerMonth: 2000,
      teamMembers: 5,
      customDomains: 1,
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations',
    price: 99,
    interval: 'month',
    features: [
      {
        id: 'chatbots-unlimited',
        name: 'Unlimited Chatbots',
        description: 'Number of chatbots you can create.',
        included: true,
      },
      {
        id: 'messages-10000',
        name: '10,000 Monthly Messages',
        description: 'Number of messages per month.',
        included: true,
      },
      {
        id: 'knowledge-base-enterprise',
        name: 'Knowledge Base Integration (Advanced)',
        description: 'Advanced knowledge base integration.',
        included: true,
      },
      {
        id: 'pdf-upload-enterprise',
        name: 'PDF Document Upload (Unlimited documents)',
        description: 'Upload PDF documents.',
        included: true,
      },
      {
        id: 'website-scraping-unlimited',
        name: 'Website Scraping (Unlimited websites)',
        description: 'Scrape websites for content.',
        included: true,
      },
      {
        id: 'custom-branding-enterprise',
        name: 'Custom Branding (Advanced)',
        description: 'Customize the look and feel.',
        included: true,
      },
      {
        id: 'analytics-dashboard-enterprise',
        name: 'Analytics Dashboard (Advanced)',
        description: 'Advanced analytics dashboard.',
        included: true,
      },
      {
        id: 'multi-language-support-all',
        name: 'Multi-language Support (All languages)',
        description: 'Support for multiple languages.',
        included: true,
      },
      {
        id: 'api-access-enterprise',
        name: 'API Access',
        description: 'Access to the API.',
        included: true,
      },
      {
        id: 'dedicated-support-priority',
        name: 'Dedicated Support (Priority)',
        description: 'Dedicated support.',
        included: true,
      },
      {
        id: 'white-label-option-enterprise',
        name: 'White-label Option',
        description: 'White-label option.',
        included: true,
      },
    ],
    limits: {
      chatbots: Infinity,
      messagesPerMonth: 10000,
      teamMembers: Infinity,
      customDomains: Infinity,
    },
  },
];
