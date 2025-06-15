import Stripe from 'stripe';
import { z } from 'zod';

// Stripe configuration
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

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
