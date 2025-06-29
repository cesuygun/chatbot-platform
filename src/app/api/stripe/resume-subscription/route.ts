import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';

export async function POST(request: Request) {
  try {
    const { subscriptionId } = await request.json();

    if (!subscriptionId) {
      return NextResponse.json({ error: 'Subscription ID is required' }, { status: 400 });
    }

    // Initialize Stripe client lazily
    const stripe = getStripe();

    // Resume the subscription (remove cancel at period end)
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancel_at_period_end: subscription.cancel_at_period_end,
      },
    });
  } catch (error) {
    console.error('Error resuming subscription:', error);
    return NextResponse.json({ error: 'Failed to resume subscription' }, { status: 500 });
  }
} 