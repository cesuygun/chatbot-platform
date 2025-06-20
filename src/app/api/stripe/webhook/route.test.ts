import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';
import Stripe from 'stripe';

// Mock the getStripe function
vi.mock('@/lib/stripe', () => ({
  getStripe: vi.fn().mockReturnValue({
    webhooks: {
      constructEvent: vi.fn().mockImplementation((payload, signature, secret) => {
        if (!signature || !secret) {
          throw new Error('Invalid signature');
        }
        return JSON.parse(payload);
      }),
    },
  }),
}));

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockImplementation(() => ({
    from: vi.fn().mockReturnThis(),
    insert: vi.fn().mockResolvedValue({ error: null }),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ error: null }),
  })),
}));

// Define a shared mockEvent with all required properties for type safety
const baseMockEvent = {
  id: 'evt_test',
  object: 'event',
  api_version: '2025-05-28.basil',
  created: Date.now(),
  data: {
    object: {
      id: 'cs_test',
      object: 'checkout.session',
      metadata: { userId: 'user_test' },
      status: 'complete',
      payment_status: 'paid',
      subscription: 'sub_test',
      customer: 'cus_test',
      amount_total: 1000,
      currency: 'usd',
      customer_details: {
        email: 'test@example.com',
        tax_exempt: 'none',
        tax_ids: [],
      },
      mode: 'subscription',
      payment_method_types: ['card'],
    } as unknown as Stripe.Checkout.Session,
  },
  livemode: false,
  pending_webhooks: 1,
  request: { id: 'req_test', idempotency_key: null },
  type: 'checkout.session.completed',
} as unknown as Stripe.Event;

describe('Stripe Webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = 'test_secret_key';
    process.env.STRIPE_WEBHOOK_SECRET = 'test_webhook_secret';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'test_supabase_url';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test_service_role_key';
  });

  it('should handle successful webhook event', async () => {
    const mockEvent = { ...baseMockEvent };

    const req = new NextRequest('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      headers: {
        'stripe-signature': 'test_signature',
      },
      body: JSON.stringify(mockEvent),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ received: true });
  });

  it('should handle subscription update event', async () => {
    const mockEvent = {
      ...baseMockEvent,
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_test',
          status: 'active',
          items: {
            data: [{
              current_period_end: Math.floor(Date.now() / 1000) + 86400,
            }],
          },
        } as unknown as Stripe.Subscription,
      },
    } as unknown as Stripe.Event;

    const req = new NextRequest('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      headers: {
        'stripe-signature': 'test_signature',
      },
      body: JSON.stringify(mockEvent),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ received: true });
  });

  it('should handle subscription deletion event', async () => {
    const mockEvent = {
      ...baseMockEvent,
      type: 'customer.subscription.deleted',
      data: {
        object: {
          id: 'sub_test',
          status: 'canceled',
          items: {
            data: [{
              current_period_end: Math.floor(Date.now() / 1000) + 86400,
            }],
          },
        } as unknown as Stripe.Subscription,
      },
    } as unknown as Stripe.Event;

    const req = new NextRequest('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      headers: {
        'stripe-signature': 'test_signature',
      },
      body: JSON.stringify(mockEvent),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ received: true });
  });

  it('should return 400 if webhook signature verification fails', async () => {
    const mockEvent = { ...baseMockEvent };

    const req = new NextRequest('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      body: JSON.stringify(mockEvent),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: 'Missing stripe signature' });
  });

  it('should handle unsupported event types', async () => {
    const mockEvent = {
      ...baseMockEvent,
      type: 'unsupported.event' as Stripe.Event.Type,
    } as unknown as Stripe.Event;

    const req = new NextRequest('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      headers: {
        'stripe-signature': 'test_signature',
      },
      body: JSON.stringify(mockEvent),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ received: true });
  });

  it('should return 400 if environment variables are missing', async () => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;

    const mockEvent = { ...baseMockEvent };

    const req = new NextRequest('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      headers: {
        'stripe-signature': 'test_signature',
      },
      body: JSON.stringify(mockEvent),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: 'Missing environment variables' });
  });
});
