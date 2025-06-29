import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';

export async function POST(_request: NextRequest) {
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
    const { data: userData, error: userError } = await supabase
      .from('customers')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();
    if (userError || !userData?.stripe_customer_id) {
      return NextResponse.json({ error: 'No Stripe customer found' }, { status: 404 });
    }
    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: userData.stripe_customer_id,
      return_url: process.env.NEXT_PUBLIC_APP_URL + '/dashboard/subscription',
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating Stripe customer portal session:', error);
    return NextResponse.json({ error: 'Failed to create customer portal session' }, { status: 500 });
  }
} 