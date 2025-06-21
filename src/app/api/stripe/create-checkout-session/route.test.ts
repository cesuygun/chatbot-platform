import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

// Mock Stripe
const mockStripeCustomer = {
  id: 'cus_test123',
  email: 'test@example.com',
  metadata: { userId: 'user-123' },
};

const mockCheckoutSession = {
  url: 'https://checkout.stripe.com/session_123',
  id: 'cs_test123',
};

const mockStripe = {
  customers: {
    create: vi.fn().mockResolvedValue(mockStripeCustomer),
  },
  checkout: {
    sessions: {
      create: vi.fn().mockResolvedValue(mockCheckoutSession),
    },
  },
};

vi.mock('stripe', () => ({
  default: vi.fn().mockImplementation(() => mockStripe),
}));

// Mock Supabase
const mockSupabaseClient = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  maybeSingle: vi.fn(),
  insert: vi.fn().mockResolvedValue({ error: null }),
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockImplementation(() => mockSupabaseClient),
}));

describe('Stripe Checkout Session Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return a checkout session URL on successful creation', async () => {
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_123');
    vi.stubEnv('STRIPE_PRO_MONTHLY_PRICE_ID', 'price_pro_monthly');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://localhost:54321');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service_role_key');
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000');

    const mockUserId = 'user-123';
    const mockPlan = 'pro_monthly';

    // Mock existing customer
    mockSupabaseClient.maybeSingle.mockResolvedValue({
      data: { stripe_customer_id: 'cus_existing123' },
      error: null,
    });

    const request = new NextRequest('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ plan: mockPlan, userId: mockUserId }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.url).toBe('https://checkout.stripe.com/session_123');
    
    vi.unstubAllEnvs();
  });

  it('should create a new Stripe customer if one does not exist', async () => {
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_123');
    vi.stubEnv('STRIPE_PRO_MONTHLY_PRICE_ID', 'price_pro_monthly');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://localhost:54321');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service_role_key');
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000');

    const mockUserId = 'user-123';
    const mockPlan = 'pro_monthly';

    // Mock no existing customer
    mockSupabaseClient.maybeSingle
      .mockResolvedValueOnce({
        data: null,
        error: null,
      })
      .mockResolvedValueOnce({
        data: { email: 'test@example.com' },
        error: null,
      });

    const request = new NextRequest('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ plan: mockPlan, userId: mockUserId }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.url).toBe('https://checkout.stripe.com/session_123');
    expect(mockStripe.customers.create).toHaveBeenCalledWith({
      email: 'test@example.com',
      metadata: { userId: 'user-123' },
    });
    
    vi.unstubAllEnvs();
  });

  it('should return 400 if plan or userId is missing', async () => {
    const request = new NextRequest('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ plan: 'pro_monthly' }), // Missing userId
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('should return 500 if Supabase customer lookup fails', async () => {
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_123');
    vi.stubEnv('STRIPE_PRO_MONTHLY_PRICE_ID', 'price_pro_monthly');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://localhost:54321');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service_role_key');
    
    // Mock Supabase error
    mockSupabaseClient.maybeSingle.mockResolvedValue({
      data: null,
      error: { message: 'Database error' },
    });
    
    const request = new NextRequest('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ plan: 'pro_monthly', userId: 'user-123' }),
    });
    
    const response = await POST(request);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toMatch(/Customer lookup failed/);
    
    vi.unstubAllEnvs();
  });
}); 