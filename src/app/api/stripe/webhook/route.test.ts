import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { createBrowserClient } from '@supabase/ssr';
import { SupabaseClient } from '@supabase/supabase-js';

// Mock Stripe
vi.mock('stripe', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      webhooks: {
        constructEvent: vi.fn().mockImplementation(payload => {
          // Return the mock event that was passed in the request body
          return JSON.parse(payload.toString());
        }),
      },
    })),
  };
});

// Mock Supabase
vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn().mockImplementation(() => ({
    from: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ error: null }),
  })),
}));

// Define a shared mockEvent with all required properties for type safety
const baseMockEvent = {
  id: 'evt_test',
  object: 'event',
  api_version: '2023-10-16',
  created: Date.now(),
  data: {
    object: {
      id: 'cs_test',
      object: 'checkout.session',
      metadata: { user_id: 'test_user_id' },
      status: 'complete',
      payment_status: 'paid',
      subscription: null,
      customer: null,
      client_reference_id: null,
      amount_total: 1000,
      currency: 'usd',
      customer_details: {
        email: 'test@example.com',
        tax_exempt: 'none',
        tax_ids: [],
      },
      mode: 'subscription',
      payment_method_types: ['card'],
      url: null,
      adaptive_pricing: null,
      after_expiration: null,
      allow_promotion_codes: false,
      amount_subtotal: 1000,
      amount_tax: 0,
      automatic_tax: { enabled: false, status: null },
      billing_address_collection: null,
      cancel_url: null,
      client_secret: null,
      consent: null,
      consent_collection: null,
      currency_conversion: null,
      custom_fields: [],
      custom_text: null,
      customer_email: null,
      expires_at: null,
      invoice: null,
      invoice_creation: null,
      line_items: null,
      locale: null,
      payment_intent: null,
      payment_link: null,
      payment_method_collection: null,
      payment_method_options: null,
      phone_number_collection: { enabled: false },
      recovered_from: null,
      setup_intent: null,
      shipping_address_collection: null,
      shipping_cost: null,
      shipping_details: null,
      shipping_options: [],
      submit_type: null,
      subscription_data: null,
      total_details: null,
      collected_information: null,
      created: Date.now(),
      customer_creation: null,
      discounts: [],
      payment_method_configuration_details: null,
    } as unknown as Stripe.Checkout.Session,
  },
  livemode: false,
  pending_webhooks: 1,
  request: { id: 'req_test', idempotency_key: null },
  type: 'checkout.session.completed' as const,
} as unknown as Stripe.Event;

describe('Stripe Webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = 'test_secret_key';
    process.env.STRIPE_WEBHOOK_SECRET = 'test_webhook_secret';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'test_supabase_url';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test_supabase_anon_key';
  });

  it('should handle successful webhook event', async () => {
    const mockEvent = { ...baseMockEvent };

    const mockStripe = new Stripe('test_key');
    vi.mocked(mockStripe.webhooks.constructEvent).mockReturnValue(mockEvent);

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

  it('should return 400 if stripe signature is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: 'Missing Stripe signature' });
  });

  it('should return 400 if webhook signature verification fails', async () => {
    const mockEvent = { ...baseMockEvent };

    const stripeModule = await import('stripe');
    const mockStripeInstance = new stripeModule.default('test_key');
    vi.spyOn(mockStripeInstance.webhooks, 'constructEvent').mockImplementation(() => {
      throw new Error('Invalid signature');
    });
    vi.mocked(stripeModule.default).mockReturnValue(mockStripeInstance);

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
    expect(data).toEqual({ error: 'Webhook signature verification failed' });
  });

  it('should return 400 for unsupported event types', async () => {
    const mockEvent = {
      ...baseMockEvent,
      type: 'unsupported.event' as Stripe.Event.Type,
    };

    const mockStripe = new Stripe('test_key');
    vi.mocked(mockStripe.webhooks.constructEvent).mockReturnValue(mockEvent);

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
    expect(data).toEqual({ error: 'Unsupported event type' });
  });

  it('should return 500 if environment variables are missing', async () => {
    delete process.env.STRIPE_SECRET_KEY;

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

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Missing environment variables' });
  });

  it('should return 500 if Supabase update fails', async () => {
    const mockEvent = { ...baseMockEvent };

    const mockStripe = new Stripe('test_key');
    vi.mocked(mockStripe.webhooks.constructEvent).mockReturnValue(mockEvent);

    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: new Error('Update failed') }),
    } as unknown as SupabaseClient;

    vi.mocked(createBrowserClient).mockReturnValue(mockSupabase);

    const req = new NextRequest('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      headers: {
        'stripe-signature': 'test_signature',
      },
      body: JSON.stringify(mockEvent),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Failed to update user subscription' });
  });
});
