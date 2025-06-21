import { NextResponse, NextRequest } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  try {
    const PRICE_ID_MAP = {
      pro_monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
      pro_yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID,
      enterprise_monthly: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID,
      enterprise_yearly: process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID,
    };

    type Plan = keyof typeof PRICE_ID_MAP;

    const { plan, userId } = await request.json();

    // Validate plan and userId
    if (!plan || !PRICE_ID_MAP[plan as Plan]) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }
    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 400 });
    }

    // Look up customer in Supabase, check for errors
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('stripe_customer_id')
      .eq('id', userId)
      .maybeSingle();

    if (customerError) {
      return NextResponse.json({ error: 'Customer lookup failed' }, { status: 500 });
    }

    let stripeCustomerId = customer?.stripe_customer_id;

    // If no Stripe customer, look up user and create one
    if (!stripeCustomerId) {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .maybeSingle();

      if (userError || !user?.email) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const stripeCustomer = await stripe.customers.create({
        email: user.email,
        metadata: { userId },
      });
      stripeCustomerId = stripeCustomer.id;

      const { error: insertError } = await supabase
        .from('customers')
        .insert({ id: userId, stripe_customer_id: stripeCustomerId });

      if (insertError) {
        return NextResponse.json({ error: 'Failed to save customer' }, { status: 500 });
      }
    }

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      line_items: [
        {
          price: PRICE_ID_MAP[plan as Plan],
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      subscription_data: {
        metadata: { userId },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
