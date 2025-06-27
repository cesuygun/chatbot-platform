import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';

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
        const price = await stripe.prices.retrieve(id, { expand: ['product'] });
        return price;
      })
    );
    // Organize by plan and interval
    const plans: Record<string, any> = {};
    for (const price of prices) {
      if (!price || typeof price.unit_amount !== 'number' || !price.product) continue;
      const product = price.product as any;
      const planKey = product.name.toLowerCase(); // e.g., 'free', 'pro', 'enterprise'
      const interval = price.recurring?.interval; // 'month' or 'year'
      if (!interval) continue;
      // Parse features from product metadata
      let features: string[] = [];
      if (product.metadata && typeof product.metadata.features === 'string') {
        try {
          features = JSON.parse(product.metadata.features);
        } catch {}
      }
      if (!plans[planKey]) plans[planKey] = { name: product.name, description: product.description, prices: {}, features };
      plans[planKey].prices[interval] = {
        id: price.id,
        amount: price.unit_amount,
        currency: price.currency,
        interval,
        nickname: price.nickname,
      };
      plans[planKey].features = features;
    }
    return NextResponse.json({ plans });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
} 