import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const PRICE_ID_MAP = {
      pro_monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
      pro_yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID,
      enterprise_monthly: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID,
      enterprise_yearly: process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID,
    };

    type Plan = keyof typeof PRICE_ID_MAP;

    const { plan } = await request.json();
    const userId = user.id;
    const userEmail = user.email;

    // Validate plan
    if (!plan || !PRICE_ID_MAP[plan as Plan]) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
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

    // If no Stripe customer, create one
    if (!stripeCustomerId) {
      if (!userEmail) {
        return NextResponse.json({ error: 'User email not found' }, { status: 404 });
      }

      const stripeCustomer = await stripe.customers.create({
        email: userEmail,
        metadata: { userId },
      });
      stripeCustomerId = stripeCustomer.id;

      const { error: upsertError } = await supabase
        .from('customers')
        .upsert({ id: userId, stripe_customer_id: stripeCustomerId });

      if (upsertError) {
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
