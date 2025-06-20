import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getStripe, subscriptionSchema, formatStripeDate } from '@/lib/stripe';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

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

    // Get user's Stripe customer ID from Supabase
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (userError || !userData?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'User not found or no Stripe customer ID' },
        { status: 404 }
      );
    }

    // Get active subscription from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: userData.stripe_customer_id,
      status: 'active',
      expand: ['data.default_payment_method'],
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return NextResponse.json({ subscription: null });
    }

    const subscription = subscriptions.data[0];
    const price = await stripe.prices.retrieve(subscription.items.data[0].price.id);

    const subscriptionData = {
      id: subscription.id,
      status: subscription.status,
      current_period_end: subscription.items.data[0].current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end,
      plan: {
        name: price.nickname || 'Unknown Plan',
        interval: price.recurring?.interval || 'month',
        amount: price.unit_amount || 0,
      },
    };

    // Validate subscription data
    const validationResult = subscriptionSchema.safeParse(subscriptionData);
    if (!validationResult.success) {
      throw new Error('Invalid subscription data');
    }

    return NextResponse.json({
      subscription: {
        ...subscriptionData,
        current_period_end: formatStripeDate(subscriptionData.current_period_end),
      },
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
  }
}
