import { vi } from 'vitest';

// Create a mock response factory
const createMockResponse = (body: unknown, ok = true, status = 200) => ({
  ok,
  status,
  statusText: ok ? 'OK' : 'Error',
  headers: new Headers(),
  redirected: false,
  type: 'basic' as ResponseType,
  url: '',
  clone() { return this; },
  body: null,
  bodyUsed: false,
  arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
  blob: () => Promise.resolve(new Blob()),
  formData: () => Promise.resolve(new FormData()),
  json: () => Promise.resolve(body),
  text: () => Promise.resolve(JSON.stringify(body)),
  bytes: () => Promise.resolve(new Uint8Array()),
});

// Mock pricing data that matches what the component expects
const mockPricingData = {
  plans: {
    free: {
      name: 'Free',
      description: 'Free plan',
      prices: { month: { amount: 0, currency: 'eur' } },
      features: ['1 Chatbot', '100 Messages']
    },
    pro: {
      name: 'Pro',
      description: 'Pro plan',
      prices: { month: { amount: 2900, currency: 'eur' } },
      features: ['5 Chatbots', '1000 Messages']
    },
    enterprise: {
      name: 'Enterprise',
      description: 'Enterprise plan',
      prices: { month: { amount: 9900, currency: 'eur' } },
      features: ['Unlimited Chatbots', 'Unlimited Messages']
    }
  }
};

// Create fetch mock that returns pricing data for /api/pricing
const mockFetchImpl = (input: RequestInfo | URL) => {
  let url = '';
  if (typeof input === 'string') {
    url = input;
  } else if (input instanceof Request) {
    url = input.url;
  } else if (input instanceof URL) {
    url = input.toString();
  }
  
  if (url.includes('/api/pricing')) {
    return Promise.resolve(createMockResponse(mockPricingData));
  }
  
  // Default response for other URLs
  return Promise.resolve(createMockResponse({ error: 'Not found' }, false, 404));
};

const mockFetch = vi.fn(mockFetchImpl);
(global as unknown as { fetch: typeof mockFetch }).fetch = mockFetch;

import { screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { PricingPlans } from '@/components/pricing/PricingPlans';
import { renderWithProviders } from '@/test/setup';
import { useAuth } from '@/contexts/auth/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';

// Mock next/navigation
const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

// Mock custom hooks
vi.mock('@/contexts/auth/AuthContext');
vi.mock('@/hooks/useSubscription');

const mockUseAuth = useAuth as jest.Mock;
const mockUseSubscription = useSubscription as jest.Mock;

describe.skip('PricingPlans', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    pushMock.mockClear();
  });

  describe('Logged-out users', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ user: null });
      mockUseSubscription.mockReturnValue({ subscription: null });
    });

    it('shows correct button text for logged-out users', async () => {
      renderWithProviders(<PricingPlans />);
      
      await waitFor(() => {
        expect(screen.getByText('Get Started')).toBeInTheDocument();
        expect(screen.getByText('Upgrade to Pro')).toBeInTheDocument();
        expect(screen.getByText('Upgrade to Enterprise')).toBeInTheDocument();
      });
    });

    it('redirects to register when a logged-out user clicks "Get Started"', async () => {
      renderWithProviders(<PricingPlans />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Get Started'));
      });

      expect(pushMock).toHaveBeenCalledWith('/register');
    });

    it('redirects to register when a logged-out user clicks "Upgrade to Pro"', async () => {
      renderWithProviders(<PricingPlans />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Upgrade to Pro'));
      });

      expect(pushMock).toHaveBeenCalledWith('/register');
    });
  });

  describe('Logged-in users with no subscription', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ user: { id: '1', email: 'test@example.com' } });
      mockUseSubscription.mockReturnValue({ subscription: null });
    });

    it('shows "Go to Dashboard" for Free plan', async () => {
      renderWithProviders(<PricingPlans />);
      
      await waitFor(() => {
        expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
      });
    });

    it('shows "Upgrade to Pro" for Pro plan', async () => {
      renderWithProviders(<PricingPlans />);
      
      await waitFor(() => {
        expect(screen.getByText('Upgrade to Pro')).toBeInTheDocument();
      });
    });

    it('redirects to dashboard when clicking "Go to Dashboard"', async () => {
      renderWithProviders(<PricingPlans />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Go to Dashboard'));
      });

      expect(pushMock).toHaveBeenCalledWith('/dashboard');
    });

    it('creates checkout session when clicking "Upgrade to Pro"', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ url: 'https://checkout.stripe.com/test' }));
      
      renderWithProviders(<PricingPlans />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Upgrade to Pro'));
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/stripe/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan: 'pro_month' })
        });
      });
    });
  });

  describe('Logged-in users with Free subscription', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ user: { id: '1', email: 'test@example.com' } });
      mockUseSubscription.mockReturnValue({ 
        subscription: { plan: { id: 'free' } } 
      });
    });

    it('shows "Current Plan" for Free plan', async () => {
      renderWithProviders(<PricingPlans />);
      
      await waitFor(() => {
        const currentPlanButton = screen.getByRole('button', { name: /current plan/i });
        expect(currentPlanButton).toBeInTheDocument();
        expect(currentPlanButton).toBeDisabled();
      });
    });

    it('shows "Upgrade to Pro" for Pro plan', async () => {
      renderWithProviders(<PricingPlans />);
      
      await waitFor(() => {
        expect(screen.getByText('Upgrade to Pro')).toBeInTheDocument();
      });
    });
  });

  describe('Logged-in users with Pro subscription', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ user: { id: '1', email: 'test@example.com' } });
      mockUseSubscription.mockReturnValue({ 
        subscription: { plan: { id: 'pro' } } 
      });
    });

    it('shows "Current Plan" for Pro plan', async () => {
      renderWithProviders(<PricingPlans />);
      
      await waitFor(() => {
        const currentPlanButton = screen.getByRole('button', { name: /current plan/i });
        expect(currentPlanButton).toBeInTheDocument();
        expect(currentPlanButton).toBeDisabled();
      });
    });

    it('shows "Go to Dashboard" for Free plan', async () => {
      renderWithProviders(<PricingPlans />);
      
      await waitFor(() => {
        expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
      });
    });
  });

  describe('Error handling', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ user: { id: '1', email: 'test@example.com' } });
      mockUseSubscription.mockReturnValue({ subscription: null });
    });

    it('handles checkout session creation failure', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ error: 'Failed to create session' }, false, 500));
      
      renderWithProviders(<PricingPlans />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Upgrade to Pro'));
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/stripe/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan: 'pro_month' })
        });
      });
    });
  });
});
