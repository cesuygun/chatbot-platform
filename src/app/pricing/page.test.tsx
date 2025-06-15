import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import PricingPlans from '@/components/pricing/PricingPlans';
import { AuthProvider } from '@/contexts/auth/AuthContext';

// Mock next/navigation
const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  getSupabase: () => ({
    auth: {
      getSession: () => Promise.resolve({ data: { session: null } }),
      onAuthStateChange: () => ({
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      }),
    },
  }),
}));

// Mock AuthContext
vi.mock('@/contexts/auth/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock window.location
const mockLocation = {
  href: '',
  assign: vi.fn(),
  replace: vi.fn(),
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

describe('PricingPlans', () => {
  const renderWithAuth = (component: React.ReactNode) => {
    return render(<AuthProvider>{component}</AuthProvider>);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all pricing plans', () => {
    renderWithAuth(<PricingPlans />);
    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('Pro')).toBeInTheDocument();
    expect(screen.getByText('Enterprise')).toBeInTheDocument();
  });

  it('shows monthly prices by default', () => {
    renderWithAuth(<PricingPlans />);
    expect(screen.getByText('$0')).toBeInTheDocument();
    expect(screen.getByText('$29')).toBeInTheDocument();
    expect(screen.getByText('$99')).toBeInTheDocument();
  });

  it('shows yearly prices when yearly is selected', () => {
    renderWithAuth(<PricingPlans />);
    const yearlyToggle = screen.getByRole('button', { name: /yearly/i });
    fireEvent.click(yearlyToggle);
    expect(screen.getByText(content => content.includes('$0'))).toBeInTheDocument();
    expect(screen.getByText('$0')).toBeInTheDocument();
    expect(screen.getByText('$278')).toBeInTheDocument();
    expect(screen.getByText('$950')).toBeInTheDocument();
  });

  it('highlights the Pro plan', () => {
    renderWithAuth(<PricingPlans />);
    const proPlan = screen.getByTestId('pro-plan-card');
    expect(proPlan).toHaveClass('border-primary');
  });

  it('shows correct button text for each plan', () => {
    renderWithAuth(<PricingPlans />);
    expect(screen.getByText('Get Started')).toBeInTheDocument();
    expect(screen.getByText('Start Free Trial')).toBeInTheDocument();
    expect(screen.getByText('Contact Sales')).toBeInTheDocument();
  });

  it('displays all features for each plan', () => {
    renderWithAuth(<PricingPlans />);
    expect(screen.getByText('1 Chatbot')).toBeInTheDocument();
    expect(screen.getByText('5 Chatbots')).toBeInTheDocument();
    expect(screen.getByText('Unlimited Chatbots')).toBeInTheDocument();
  });

  it('redirects to login when clicking on a plan without being logged in', async () => {
    renderWithAuth(<PricingPlans />);
    const getStartedButton = screen.getByText('Get Started');
    fireEvent.click(getStartedButton);
    expect(pushMock).toHaveBeenCalledWith('/login?redirectTo=/pricing');
  });

  it('opens email client for enterprise plan', () => {
    renderWithAuth(<PricingPlans />);
    const contactSalesButton = screen.getByText('Contact Sales');
    fireEvent.click(contactSalesButton);
    expect(window.location.href).toBe('mailto:sales@example.com');
  });
});
