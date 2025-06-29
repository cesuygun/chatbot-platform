import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import type { PricingPlan } from '@/types/pricing';

const priceIds = [
  process.env.STRIPE_FREE_MONTHLY_PRICE_ID!,
  process.env.STRIPE_FREE_YEARLY_PRICE_ID!,
  process.env.STRIPE_PRO_MONTHLY_PRICE_ID!,
  process.env.STRIPE_PRO_YEARLY_PRICE_ID!,
  process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID!,
  process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID!,
];

export async function GET() {
  try {
    const stripe = getStripe();
    const prices = await Promise.all(
      priceIds.map(async (id) => {
        if (!id) {
          console.warn('Missing price ID in environment variables');
          return null;
        }
        try {
          const price = await stripe.prices.retrieve(id, { expand: ['product'] });
          return price;
        } catch (error) {
          console.error(`Failed to retrieve price ${id}:`, error);
          return null;
        }
      })
    );
    
    // Organize by plan and interval
    const plans: Record<string, PricingPlan> = {};
    for (const price of prices) {
      if (!price || typeof price.unit_amount !== 'number' || !price.product) continue;
      const product = price.product as { name: string; description: string; metadata?: { features?: string } };
      const planKey = product.name.toLowerCase(); // e.g., 'free', 'pro', 'enterprise'
      const interval = price.recurring?.interval as 'month' | 'year';
      if (!interval) continue;
      
      // Parse features from product metadata
      let features: string[] = [];
      if (product.metadata && typeof product.metadata.features === 'string') {
        try {
          features = JSON.parse(product.metadata.features);
        } catch (error) {
          console.warn('Failed to parse features for product:', product.name, error);
        }
      }
      
      if (!plans[planKey]) {
        plans[planKey] = { 
          name: product.name, 
          description: product.description, 
          features, 
          prices: {} 
        };
      }
      
      // Always set currency to EUR regardless of what Stripe returns
      plans[planKey].prices![interval] = {
        id: price.id,
        amount: price.unit_amount,
        currency: 'eur', // Force EUR currency
        interval,
        nickname: price.nickname ?? undefined,
      };
      plans[planKey].features = features;
    }
    
    return NextResponse.json({ plans });
  } catch (error) {
    console.error('Error fetching pricing:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
} 