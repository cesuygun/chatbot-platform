export type PricingTier = 'free' | 'pro' | 'enterprise';

export interface PricingFeature {
  id: string;
  name: string;
  description: string;
  included: boolean;
}

export interface PricingPlan {
  id: PricingTier;
  name: string;
  description: string;
  price: number;
  interval: 'month' | 'year';
  features: PricingFeature[];
  limits: {
    messagesPerMonth: number;
    chatbots: number;
    teamMembers: number;
    customDomains: number;
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
