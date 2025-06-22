import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import PricingPlans from '@/components/pricing/PricingPlans';
import { AuthProvider } from '@/contexts/auth/AuthProvider';
import { useAuth } from '@/contexts/auth/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';

// Mock next/navigation
const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

// Mock AuthContext
vi.mock('@/contexts/auth/AuthContext', async importOriginal => {
  const actual = await importOriginal();
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(actual as any),
    useAuth: vi.fn(),
  };
});

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn().mockReturnValue({
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
  }),
}));

// Mock useSubscription hook
vi.mock('@/hooks/useSubscription');

// Mock window.location
Object.defineProperty(window, 'location', {
  value: { href: '', assign: vi.fn(), replace: vi.fn() },
  writable: true,
});

describe('PricingPlans', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockUseAuth = useAuth as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockUseSubscription = useSubscription as any;

  const renderWithProviders = (component: React.ReactNode) => {
    return render(<AuthProvider>{component}</AuthProvider>);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: null, loading: false });
    mockUseSubscription.mockReturnValue({ subscription: null, loading: false });
  });

  it('renders all pricing plans', () => {
    renderWithProviders(<PricingPlans />);
    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('Pro')).toBeInTheDocument();
    expect(screen.getByText('Enterprise')).toBeInTheDocument();
  });

  it('shows monthly prices in Euros by default', () => {
    renderWithProviders(<PricingPlans />);
    expect(screen.getByText('€0')).toBeInTheDocument();
    expect(screen.getByText('€29')).toBeInTheDocument();
    expect(screen.getByText('€99')).toBeInTheDocument();
  });

  it('shows correct button text for logged-out users', () => {
    renderWithProviders(<PricingPlans />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.some(b => b.textContent === 'Get Started')).toBe(true);
    expect(buttons.some(b => b.textContent === 'Sign up')).toBe(true);
  });

  it('redirects to login when a logged-out user clicks "Get Started"', () => {
    renderWithProviders(<PricingPlans />);
    fireEvent.click(screen.getByText('Get Started'));
    expect(pushMock).toHaveBeenCalledWith('/login?redirectTo=/pricing');
  });

  it('shows correct button text for a logged-in user with no subscription', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'test-user' }, loading: false });
    renderWithProviders(<PricingPlans />);
    await waitFor(() => {
      // Free plan should show 'Current Plan'
      const currentPlanButtons = screen.getAllByText('Current Plan');
      expect(currentPlanButtons.length).toBeGreaterThanOrEqual(1);
      // Pro and Enterprise should show 'Upgrade'
      const upgradeButtons = screen.getAllByText('Upgrade');
      expect(upgradeButtons.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows "Current Plan" for the subscribed plan', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'test-user' }, loading: false });
    mockUseSubscription.mockReturnValue({
      subscription: { plan: { id: 'pro' } },
      loading: false,
    });
    renderWithProviders(<PricingPlans />);
    await waitFor(() => {
      // There will be a badge and a button with 'Current Plan', so get all and find the button
      const currentPlanButtons = screen.getAllByText('Current Plan');
      // Find the button element
      const button = currentPlanButtons.find(el => el.tagName === 'BUTTON');
      expect(button).toBeDefined();
      expect(button).toBeDisabled();
    });
  });
});
