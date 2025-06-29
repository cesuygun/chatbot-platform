export type PricingTier = 'free' | 'pro' | 'enterprise';

export interface PricingFeature {
  id: string;
  name: string;
  description: string;
  included: boolean;
}

export interface StripePrice {
  id: string;
  amount: number;
  currency: string;
  interval: 'month' | 'year';
  nickname?: string;
}

export interface PricingPlan {
  id?: PricingTier;
  name: string;
  description: string;
  price?: number;
  interval?: 'month' | 'year';
  features: PricingFeature[] | string[];
  limits?: {
    messagesPerMonth: number;
    chatbots: number;
    teamMembers: number;
    customDomains: number;
  };
  prices?: {
    [interval: string]: StripePrice;
  };
}

export interface Subscription {
  id: string;
  userId: string;
  planId: PricingTier;
  status: 'active' | 'canceled' | 'past_due';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}
