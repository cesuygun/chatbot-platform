import Stripe from 'stripe';
import { z } from 'zod';

// Lazy initialization of Stripe client to prevent build-time errors
let stripeInstance: Stripe | null = null;

export const getStripe = (): Stripe => {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }
    stripeInstance = new Stripe(secretKey, {
  apiVersion: '2025-05-28.basil',
});
  }
  return stripeInstance;
};

// Plan mapping configuration
export const PLAN_ID_MAP: Record<string, { name: string; interval: string }> = {
  [process.env.STRIPE_PRO_MONTHLY_PRICE_ID!]: { name: 'Pro', interval: 'month' },
  [process.env.STRIPE_PRO_YEARLY_PRICE_ID!]: { name: 'Pro', interval: 'year' },
  [process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID!]: { name: 'Enterprise', interval: 'month' },
  [process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID!]: { name: 'Enterprise', interval: 'year' },
  [process.env.STRIPE_FREE_MONTHLY_PRICE_ID!]: { name: 'Free', interval: 'month' },
  [process.env.STRIPE_FREE_YEARLY_PRICE_ID!]: { name: 'Free', interval: 'year' },
};

// Utility function to get plan name from price ID
export const getPlanFromPriceId = (priceId: string): { name: string; interval: string } => {
  return PLAN_ID_MAP[priceId] || { name: 'Unknown Plan', interval: 'month' };
};

// Utility function to get plan name from product name
export const getPlanFromProductName = (productName: string): string => {
  const name = productName.toLowerCase();
  if (name.includes('pro')) return 'Pro';
  if (name.includes('enterprise')) return 'Enterprise';
  if (name.includes('free')) return 'Free';
  return 'Unknown Plan';
};

// Type validation schemas
export const subscriptionSchema = z.object({
  id: z.string(),
  status: z.string(),
  current_period_end: z.number(),
  cancel_at_period_end: z.boolean(),
  plan: z.object({
    name: z.string(),
    interval: z.string(),
    amount: z.number(),
    chatbot_limit: z.number().optional(),
    message_limit: z.number().optional(),
  }),
});

export const invoiceSchema = z.object({
  id: z.string(),
  amount_paid: z.number(),
  status: z.string(),
  created: z.number(),
  invoice_pdf: z.string().nullable(),
});

// Type guards
export const isSubscription = (data: unknown): data is Stripe.Subscription => {
  return subscriptionSchema.safeParse(data).success;
};

export const isInvoice = (data: unknown): data is Stripe.Invoice => {
  return invoiceSchema.safeParse(data).success;
};

// Utility functions
export const formatStripeAmount = (amount: number): string => {
  return (amount / 100).toFixed(2);
};

export const formatStripeDate = (timestamp: number): string => {
  return new Date(timestamp * 1000).toISOString();
};

// Format currency in EUR
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(amount / 100);
};
