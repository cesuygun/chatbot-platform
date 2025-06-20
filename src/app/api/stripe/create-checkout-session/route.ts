import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getStripe } from '@/lib/stripe';

const PRICE_IDS = {
  free: {
    monthly: null,
    yearly: null,
  },
  pro: {
    monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID!,
    yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID!,
  },
  enterprise: {
    monthly: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID!,
    yearly: process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID!,
  },
};

export async function POST(req: Request) {
  try {
    const { planId, interval, userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Initialize Supabase client lazily
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Initialize Stripe client lazily
    const stripe = getStripe();

    // Get user's email from Supabase
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create or retrieve Stripe customer
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    let customerId: string;

    if (customerError || !customerData?.stripe_customer_id) {
      const customer = await stripe.customers.create({
        email: userData.email,
        metadata: {
          userId,
        },
      });
      customerId = customer.id;

      // Store customer ID in Supabase
      await supabase.from('customers').insert({
        user_id: userId,
        stripe_customer_id: customerId,
      });
    } else {
      customerId = customerData.stripe_customer_id;
    }

    // Create checkout session
    const priceId = PRICE_IDS[planId as keyof typeof PRICE_IDS][interval as 'monthly' | 'yearly'];

    if (!priceId) {
      return NextResponse.json({ error: 'Invalid plan or interval' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      metadata: {
        userId,
        planId,
        interval,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json({ error: 'Error creating checkout session' }, { status: 500 });
  }
}
