import { NextRequest, NextResponse } from 'next/server';
import { Stripe } from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

const handleSuccessfulSubscription = async (session: Stripe.Checkout.Session) => {
  const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
  const userId = subscription.metadata.userId;

  if (!userId) {
    console.error('User ID not found in subscription metadata');
    return;
  }

  const { error } = await supabase
    .from('subscriptions')
    .insert({
      user_id: userId,
      stripe_subscription_id: subscription.id,
      plan_name: subscription.items.data[0].price.lookup_key || 'pro', // fallback to 'pro'
      status: subscription.status,
      current_period_end: new Date((subscription as any).current_period_end * 1000),
    });

  if (error) {
    console.error('Error saving subscription to database:', error);
  }
};

const handleSubscriptionUpdate = async (stripeSubscription: Stripe.Subscription) => {
    const { error } = await supabase
        .from('subscriptions')
        .update({
            plan_name: stripeSubscription.items.data[0].price.lookup_key || 'pro',
            status: stripeSubscription.status,
            current_period_end: new Date((stripeSubscription as any).current_period_end * 1000),
        })
        .eq('stripe_subscription_id', stripeSubscription.id);
    
    if (error) {
        console.error('Error updating subscription in database:', error);
    }
}

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  const body = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig!, endpointSecret);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`❌ Error message: ${errorMessage}`);
    return NextResponse.json({ error: `Webhook Error: ${errorMessage}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleSuccessfulSubscription(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;
      default:
        // console.log(`Unhandled event type ${event.type}`);
    }
  } catch (error) {
      console.error('Error handling webhook event:', error);
      return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
