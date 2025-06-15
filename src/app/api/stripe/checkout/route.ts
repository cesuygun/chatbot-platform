import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Disable edge runtime for this route
export const runtime = 'nodejs';

// Add CORS headers to the response
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

export async function POST(req: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_ID;
  const domain = process.env.NEXT_PUBLIC_APP_URL;

  if (!secretKey || !priceId || !domain) {
    return NextResponse.json(
      { error: 'Missing environment variables' },
      {
        status: 500,
        headers: corsHeaders(),
      }
    );
  }

  const stripe = new Stripe(secretKey, {
    apiVersion: '2025-05-28.basil',
  });

  let user_id: string | null = null;
  const contentType = req.headers.get('content-type') || '';

  try {
    if (contentType.includes('application/json')) {
      const json = await req.json();
      user_id = json.user_id;
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      user_id = formData.get('user_id') as string;
    }

    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        {
          status: 400,
          headers: corsHeaders(),
        }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        user_id,
      },
      subscription_data: {
        metadata: {
          user_id,
        },
      },
      success_url: `${domain}/dashboard?checkout=success`,
      cancel_url: `${domain}/dashboard?checkout=cancel`,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        {
          status: 500,
          headers: corsHeaders(),
        }
      );
    }

    return NextResponse.json({ url: session.url }, { headers: corsHeaders() });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      {
        status: 500,
        headers: corsHeaders(),
      }
    );
  }
}
