import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

// Mock the getStripe function
vi.mock('@/lib/stripe', () => ({
  getStripe: vi.fn().mockReturnValue({
  checkout: {
    sessions: {
      create: vi.fn().mockResolvedValue({
        url: 'https://checkout.stripe.com/test',
      }),
    },
  },
  }),
}));

describe('POST /api/stripe/checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = 'test_stripe_secret_key';
    process.env.STRIPE_PRICE_ID = 'test_price_id';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
  });

  afterEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_PRICE_ID;
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  it('creates a checkout session and returns the URL', async () => {
    const request = new NextRequest('http://localhost:3000/api/stripe/checkout', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ user_id: 'test_user_id' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.url).toBe('https://checkout.stripe.com/test');
  });

  it('returns 400 if user_id is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/stripe/checkout', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('User ID is required');
  });

  it('returns 500 if Stripe API call fails', async () => {
    // Mock getStripe to return a failing implementation
    const { getStripe } = await import('@/lib/stripe');
    vi.mocked(getStripe).mockReturnValueOnce({
      checkout: {
        sessions: {
          create: vi.fn().mockRejectedValue(new Error('Stripe API error')),
        },
      },
    } as unknown as ReturnType<typeof getStripe>);

    const request = new NextRequest('http://localhost:3000/api/stripe/checkout', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ user_id: 'test_user_id' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to create checkout session');
  });

  it.skip('handles FormData requests', async () => {
    const formData = new FormData();
    formData.append('user_id', 'test_user_id');

    const request = new NextRequest('http://localhost:3000/api/stripe/checkout', {
      method: 'POST',
      headers: {
        'content-type': 'multipart/form-data',
      },
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.url).toBe('https://checkout.stripe.com/test');
  });

  it('returns 500 if environment variables are missing', async () => {
    // Reset all modules and mocks
    vi.resetModules();

    // Remove the env vars
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_PRICE_ID;
    delete process.env.NEXT_PUBLIC_APP_URL;

    // Re-import POST after resetModules so it uses the real getStripe
    const { POST } = await import('./route');
    const { NextRequest } = await import('next/server');

    const request = new NextRequest('http://localhost:3000/api/stripe/checkout', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ user_id: 'test_user_id' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Missing environment variables');
  });
});
