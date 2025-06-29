import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripe, subscriptionSchema, formatStripeDate, getPlanFromPriceId } from '@/lib/stripe';

export async function GET(_request: NextRequest) {
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

    const stripe = getStripe();

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

    // Get the price details from Stripe
    const price = await stripe.prices.retrieve(subscription.items.data[0].price.id);
    
    // Fetch plan info from Supabase using the Stripe price ID
    const { data: planData, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('stripe_price_id', price.id)
      .maybeSingle();

    // Fallback if plan not found
    const plan = planData || {
      name: 'Unknown',
      interval: price.recurring?.interval || 'month',
      amount: price.unit_amount || 0,
      chatbot_limit: 1,
      message_limit: 100,
    };

    const subscriptionData = {
      id: subscription.id,
      status: subscription.status,
      current_period_end: subscription.items.data[0].current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end,
      plan: {
        name: plan.name,
        interval: plan.interval,
        amount: plan.price,
        chatbot_limit: plan.chatbot_limit,
        message_limit: plan.message_limit,
      },
    };

    // Validate subscription data
    const validationResult = subscriptionSchema.safeParse(subscriptionData);
    if (!validationResult.success) {
      console.error('Subscription validation failed:', validationResult.error);
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
