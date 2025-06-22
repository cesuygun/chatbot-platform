import { screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
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

describe('PricingPlans', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for a logged-out user
    mockUseAuth.mockReturnValue({ user: null, loading: false });
    mockUseSubscription.mockReturnValue({
      subscription: null,
      chatbots: [],
      subscriptionLoading: false,
    });
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
    expect(screen.getByText('Get Started')).toBeInTheDocument();
    const signUpButtons = screen.getAllByText('Sign up');
    expect(signUpButtons.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Contact Us')).toBeInTheDocument();
  });

  it('redirects to register when a logged-out user clicks "Get Started"', async () => {
    renderWithProviders(<PricingPlans />);
    fireEvent.click(screen.getByText('Get Started'));
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/register');
    });
  });

  it('shows correct button text for a logged-in user with no subscription', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'test-user' }, loading: false });
    renderWithProviders(<PricingPlans />);
    await waitFor(() => {
      // Free plan should show 'Current Plan'
      const currentPlanButtons = screen.getAllByText('Current Plan');
      expect(currentPlanButtons.length).toBeGreaterThanOrEqual(1);
      // Pro should show 'Upgrade'
      const upgradeButtons = screen.getAllByText('Upgrade');
      expect(upgradeButtons.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows "Current Plan" for the subscribed plan', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'test-user' }, loading: false });
    mockUseSubscription.mockReturnValue({
      subscription: { plan: { id: 'pro', name: 'Pro' } },
      chatbots: [],
      subscriptionLoading: false,
    });

    renderWithProviders(<PricingPlans />);

    await waitFor(() => {
      const currentPlanButton = screen.getByRole('button', { name: /current plan/i });
      expect(currentPlanButton).toBeInTheDocument();
      expect(currentPlanButton).toBeDisabled();
    });
  });
});
