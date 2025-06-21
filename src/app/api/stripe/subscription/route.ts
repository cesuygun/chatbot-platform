import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripe, subscriptionSchema, formatStripeDate } from '@/lib/stripe';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = user.id;

    // Initialize Stripe client lazily
    const stripe = getStripe();

    // Get user's Stripe customer ID from Supabase
    const { data: userData, error: userError } = await supabase
      .from('customers')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (userError || !userData?.stripe_customer_id) {
      // Return null subscription instead of 404 error
      return NextResponse.json({ subscription: null });
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
