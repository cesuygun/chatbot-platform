import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';

// Mock Supabase
const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
  })),
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

// Mock Stripe
const mockStripePortalSession = {
  url: 'https://billing.stripe.com/session/test123',
};

const mockStripe = {
  billingPortal: {
    sessions: {
      create: vi.fn().mockResolvedValue(mockStripePortalSession),
    },
  },
};

vi.mock('@/lib/stripe', () => ({
  getStripe: vi.fn(() => mockStripe),
}));

describe('Stripe Customer Portal Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000');
  });

  it('should return a customer portal URL on successful creation', async () => {
    // Mock authenticated user
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    // Mock customer data
    const mockSingle = vi.fn().mockResolvedValue({
      data: { stripe_customer_id: 'cus_test123' },
      error: null,
    });

    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: mockSingle,
        }),
      }),
    });

    const request = new NextRequest('http://localhost', {
      method: 'POST',
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.url).toBe('https://billing.stripe.com/session/test123');
    expect(mockStripe.billingPortal.sessions.create).toHaveBeenCalledWith({
      customer: 'cus_test123',
      return_url: 'http://localhost:3000/dashboard/subscription',
    });
  });

  it('should return 401 for unauthenticated users', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const request = new NextRequest('http://localhost', {
      method: 'POST',
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('should return 404 when no Stripe customer is found', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    const mockSingle = vi.fn().mockResolvedValue({
      data: null,
      error: null,
    });

    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: mockSingle,
        }),
      }),
    });

    const request = new NextRequest('http://localhost', {
      method: 'POST',
    });

    const response = await POST(request);
    expect(response.status).toBe(404);
  });

  it('should handle Stripe errors gracefully', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    const mockSingle = vi.fn().mockResolvedValue({
      data: { stripe_customer_id: 'cus_test123' },
      error: null,
    });

    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: mockSingle,
        }),
      }),
    });

    mockStripe.billingPortal.sessions.create.mockRejectedValue(
      new Error('Stripe API error')
    );

    const request = new NextRequest('http://localhost', {
      method: 'POST',
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
  });
}); 